import hashlib
import html
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models import Acta, ActaFirma, Auditoria, EnvioCorreo, Equipo, Usuario
from app.services.correo import CorreoError, correo_configurado, enviar_correo, proveedor
from app.services.pdf_acta import generar_pdf
from app.services.plantillas import correo_html, tabla

router = APIRouter(prefix="/actas", tags=["documentos"])

ESTADOS_CON_PDF = ("FIRMADA", "ENVIADA", "DEVUELTA")
COLOMBIA = timezone(timedelta(hours=-5))


class EnviarCorreo(BaseModel):
    # Si no se indica, se usa el correo del paciente guardado en el acta.
    correo: EmailStr | None = None


class EnvioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    destinatario: str
    asunto: str
    estado: str
    intentos: int
    error: str | None
    enviado_en: datetime | None
    created_at: datetime


def _cargar_acta(db: Session, acta_id: uuid.UUID) -> Acta:
    acta = db.scalar(
        select(Acta).options(joinedload(Acta.paciente), joinedload(Acta.equipo).joinedload(Equipo.tipo))
        .where(Acta.id == acta_id)
    )
    if not acta:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Acta no encontrada")
    return acta


def _ruta_pdf(acta: Acta) -> Path | None:
    return settings.pdf_dir / acta.pdf_path if acta.pdf_path else None


def _asegurar_pdf(db: Session, acta: Acta) -> Path:
    """Devuelve la ruta del PDF del acta; lo genera si todavía no existe."""
    if acta.estado not in ESTADOS_CON_PDF:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"El acta debe estar firmada por paciente y enfermera para generar el PDF (estado actual: {acta.estado})",
        )

    ruta = _ruta_pdf(acta)
    if ruta and ruta.exists():
        # Comprobación de integridad: el archivo no debe haber cambiado desde que se generó.
        if hashlib.sha256(ruta.read_bytes()).hexdigest() != acta.pdf_sha256:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR,
                                "El PDF guardado no coincide con su huella (fue modificado o dañado)")
        return ruta

    firmas = db.scalars(select(ActaFirma).where(ActaFirma.acta_id == acta.id)).all()
    contenido = generar_pdf(acta, firmas)
    settings.pdf_dir.mkdir(parents=True, exist_ok=True)
    nombre = f"acta-{acta.numero:06d}-{str(acta.id)[:8]}.pdf"
    ruta = settings.pdf_dir / nombre
    ruta.write_bytes(contenido)
    acta.pdf_path = nombre
    acta.pdf_sha256 = hashlib.sha256(contenido).hexdigest()
    db.commit()
    return ruta


@router.get("/{acta_id}/pdf")
def descargar_pdf(acta_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    acta = _cargar_acta(db, acta_id)
    ruta = _asegurar_pdf(db, acta)
    return FileResponse(ruta, media_type="application/pdf", filename=f"acta-{acta.numero:06d}.pdf")


@router.post("/{acta_id}/enviar", response_model=EnvioOut)
def enviar(acta_id: uuid.UUID, data: EnviarCorreo, request: Request, db: Session = Depends(get_db),
           user: Usuario = Depends(get_current_user)):
    acta = _cargar_acta(db, acta_id)
    if acta.estado not in ESTADOS_CON_PDF:
        raise HTTPException(status.HTTP_409_CONFLICT,
                            f"Solo se puede enviar un acta firmada (estado actual: {acta.estado})")

    destinatario = data.correo or (acta.snapshot or {}).get("paciente", {}).get("correo") or acta.paciente.correo
    if not destinatario:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El paciente no tiene correo registrado")
    if not correo_configurado():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE,
                            "El envío de correo no está configurado (faltan SMTP_HOST, SMTP_USER y SMTP_PASSWORD en el .env)")

    ruta = _asegurar_pdf(db, acta)
    numero = f"{acta.numero:06d}"
    nombre_paciente = (acta.snapshot or {}).get("paciente", {}).get("nombre_completo") or acta.paciente.nombre_completo
    asunto = f"Acta de préstamo N° {numero} - IPS Nueva Popayán"
    equipo_txt = f"{acta.equipo.tipo.nombre} {acta.equipo.marca or ''}".strip()
    prevista = acta.fecha_devolucion_prevista.astimezone(COLOMBIA).strftime("%d/%m/%Y %I:%M %p").lower() if acta.fecha_devolucion_prevista else "—"
    cuerpo = correo_html(
        "Acta de préstamo de equipo",
        f"<p>Hola {html.escape(nombre_paciente)},</p>"
        "<p>Adjuntamos el acta de préstamo del equipo de monitoreo cardíaco, firmada por usted y por nuestro personal de enfermería.</p>"
        + tabla([("Acta N°", numero), ("Equipo", html.escape(equipo_txt)), ("Serie", html.escape(acta.equipo.serie)),
                 ("Devolver antes de", html.escape(prevista))])
        + "<p>Conserve este documento. Recuerde devolver el equipo a REHABILITAR IPS SEDE NUEVA POPAYÁN en el tiempo estipulado.</p>",
    )

    envio = EnvioCorreo(acta_id=acta.id, destinatario=destinatario, asunto=asunto, estado="PENDIENTE", proveedor=proveedor())
    db.add(envio)
    db.flush()

    ip = request.client.host if request.client else None
    try:
        message_id = enviar_correo(destinatario, nombre_paciente, asunto, cuerpo,
                                   f"acta-{numero}.pdf", ruta.read_bytes())
    except CorreoError as e:
        envio.estado = "ERROR"
        envio.error = str(e)
        envio.intentos += 1
        db.add(Auditoria(usuario_id=user.id, accion="ENVIAR_CORREO_ERROR", entidad="acta",
                         entidad_id=str(acta.id), detalle={"destinatario": destinatario}, ip=ip))
        db.commit()
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"No se pudo enviar el correo: {e}")

    envio.estado = "ENVIADO"
    envio.proveedor_message_id = message_id
    envio.intentos += 1
    envio.enviado_en = datetime.now(timezone.utc)
    if acta.estado == "FIRMADA":
        acta.estado = "ENVIADA"
    db.add(Auditoria(usuario_id=user.id, accion="ENVIAR_CORREO", entidad="acta", entidad_id=str(acta.id),
                     detalle={"destinatario": destinatario}, ip=ip))
    db.commit()
    db.refresh(envio)
    return envio


@router.get("/{acta_id}/envios", response_model=list[EnvioOut])
def listar_envios(acta_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    if not db.get(Acta, acta_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Acta no encontrada")
    return db.scalars(
        select(EnvioCorreo).where(EnvioCorreo.acta_id == acta_id).order_by(EnvioCorreo.created_at.desc())
    ).all()


@router.post("/{acta_id}/comprobante", response_model=EnvioOut)
def enviar_comprobante_devolucion(acta_id: uuid.UUID, request: Request, db: Session = Depends(get_db),
                                  user: Usuario = Depends(get_current_user)):
    """Correo al paciente que deja constancia de que devolvió el equipo (con el acta adjunta)."""
    acta = _cargar_acta(db, acta_id)
    if acta.estado != "DEVUELTA":
        raise HTTPException(status.HTTP_409_CONFLICT, "El comprobante se envía cuando el equipo ya fue devuelto")
    destinatario = (acta.snapshot or {}).get("paciente", {}).get("correo") or acta.paciente.correo
    if not destinatario:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El paciente no tiene correo registrado")
    if not correo_configurado():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "El envío de correo no está configurado")

    ruta = _asegurar_pdf(db, acta)
    numero = f"{acta.numero:06d}"
    nombre = (acta.snapshot or {}).get("paciente", {}).get("nombre_completo") or acta.paciente.nombre_completo
    recibido = acta.fecha_devolucion_real.astimezone(COLOMBIA).strftime("%d/%m/%Y %I:%M %p").lower() if acta.fecha_devolucion_real else "—"
    equipo_txt = f"{acta.equipo.tipo.nombre} {acta.equipo.marca or ''}".strip()
    asunto = f"Comprobante de devolución - Acta N° {numero}"
    cuerpo = correo_html(
        "Equipo devuelto",
        f"<p>Hola {html.escape(nombre)},</p><p>Confirmamos que <b>recibimos el equipo</b> que tenía en préstamo. ¡Gracias por devolverlo a tiempo!</p>"
        + tabla([("Acta N°", numero), ("Equipo", html.escape(equipo_txt)), ("Serie", html.escape(acta.equipo.serie)),
                 ("Recibido el", html.escape(recibido))])
        + "<p>Adjuntamos nuevamente el acta como constancia.</p>",
    )
    envio = EnvioCorreo(acta_id=acta.id, destinatario=destinatario, asunto=asunto, estado="PENDIENTE", proveedor=proveedor())
    db.add(envio)
    db.flush()
    ip = request.client.host if request.client else None
    try:
        envio.proveedor_message_id = enviar_correo(destinatario, nombre, asunto, cuerpo, f"acta-{numero}.pdf", ruta.read_bytes())
    except CorreoError as e:
        envio.estado, envio.error = "ERROR", str(e)
        envio.intentos += 1
        db.commit()
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"No se pudo enviar el comprobante: {e}")
    envio.estado, envio.enviado_en = "ENVIADO", datetime.now(timezone.utc)
    envio.intentos += 1
    db.add(Auditoria(usuario_id=user.id, accion="ENVIAR_COMPROBANTE", entidad="acta", entidad_id=str(acta.id),
                     detalle={"destinatario": destinatario}, ip=ip))
    db.commit()
    db.refresh(envio)
    return envio
