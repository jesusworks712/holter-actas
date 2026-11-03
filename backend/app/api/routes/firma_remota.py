"""Firma del paciente desde su celular: la enfermera genera un enlace/QR de un solo uso y de corta duración."""
import base64
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db
from app.api.routes.firmas import ROLES_REQUERIDOS, _decodificar_png, _estado
from app.core.config import settings
from app.models import Acta, ActaFirma, Auditoria, EnlaceFirma, Equipo, Usuario
from app.services.pdf_acta import generar_pdf
from app.services.qr import qr_png

router = APIRouter(tags=["firma-remota"])

# Rate limiting simple en memoria para la firma pública (máx 10 intentos / 10 min por IP).
_intentos_firma: dict[str, list] = {}

def _check_rate(ip: str) -> None:
    ahora = datetime.now(timezone.utc)
    ventana = ahora - timedelta(minutes=10)
    intentos = [t for t in _intentos_firma.get(ip, []) if t > ventana]
    if len(intentos) >= 10:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                            "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.")
    intentos.append(ahora)
    _intentos_firma[ip] = intentos


class EnlaceOut(BaseModel):
    url: str
    expira_en: datetime
    qr_png_base64: str


class FirmaPublicaIn(BaseModel):
    imagen: str


def _huella(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _aware(d: datetime) -> datetime:
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


@router.post("/actas/{acta_id}/enlace-firma", response_model=EnlaceOut, status_code=201)
def crear_enlace(acta_id: uuid.UUID, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    acta = db.get(Acta, acta_id)
    if not acta:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Acta no encontrada")
    if acta.estado not in ("BORRADOR", "FIRMADA"):
        raise HTTPException(status.HTTP_409_CONFLICT, f"No se puede firmar un acta {acta.estado}")

    db.execute(delete(EnlaceFirma).where(EnlaceFirma.acta_id == acta.id))
    token = secrets.token_urlsafe(32)
    expira = datetime.now(timezone.utc) + timedelta(minutes=settings.FIRMA_ENLACE_MINUTOS)
    db.add(EnlaceFirma(acta_id=acta.id, token_hash=_huella(token), expira_en=expira, creado_por=user.id))
    db.add(Auditoria(usuario_id=user.id, accion="ENLACE_FIRMA", entidad="acta", entidad_id=str(acta.id)))
    db.commit()

    url = f"{settings.APP_URL.rstrip('/')}/#/firmar/{token}"
    return EnlaceOut(url=url, expira_en=expira, qr_png_base64=base64.b64encode(qr_png(url, 7)).decode("ascii"))


def _enlace_valido(db: Session, token: str) -> EnlaceFirma:
    enlace = db.scalar(select(EnlaceFirma).where(EnlaceFirma.token_hash == _huella(token)))
    if not enlace:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Este enlace no existe o ya no es válido")
    if enlace.usado_en:
        raise HTTPException(status.HTTP_410_GONE, "Este enlace ya se usó. Pide uno nuevo a la enfermera.")
    if _aware(enlace.expira_en) < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_410_GONE, "El enlace venció. Pide uno nuevo a la enfermera.")
    return enlace


def _acta_de(db: Session, enlace: EnlaceFirma) -> Acta:
    acta = db.scalar(select(Acta).options(joinedload(Acta.paciente), joinedload(Acta.equipo).joinedload(Equipo.tipo))
                     .where(Acta.id == enlace.acta_id))
    if not acta or acta.estado not in ("BORRADOR", "FIRMADA"):
        raise HTTPException(status.HTTP_410_GONE, "Esta acta ya no se puede firmar")
    return acta


@router.get("/publico/firma/{token}")
def info_publica(token: str, db: Session = Depends(get_db)):
    enlace = _enlace_valido(db, token)
    a = _acta_de(db, enlace)
    p = (a.snapshot or {}).get("paciente", {})
    return {
        "numero": a.numero,
        "paciente_nombre": p.get("nombre_completo") or a.paciente.nombre_completo,
        "paciente_documento": f"{p.get('tipo_documento', '')} {p.get('numero_documento', '')}".strip(),
        "equipo": f"{a.equipo.tipo.nombre} {a.equipo.marca or ''}".strip(),
        "serie": a.equipo.serie,
        "fecha_entrega": a.fecha_entrega,
        "fecha_devolucion_prevista": a.fecha_devolucion_prevista,
        "duracion_horas": a.duracion_horas,
        "expira_en": enlace.expira_en,
    }


@router.get("/publico/firma/{token}/pdf")
def pdf_publico(token: str, db: Session = Depends(get_db)):
    enlace = _enlace_valido(db, token)
    acta = _acta_de(db, enlace)
    return Response(generar_pdf(acta, []), media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="acta-{acta.numero:06d}.pdf"',
                             "Cache-Control": "no-store"})


@router.post("/publico/firma/{token}", status_code=201)
def firmar_publico(token: str, data: FirmaPublicaIn, request: Request, db: Session = Depends(get_db)):
    _check_rate(request.client.host if request.client else "desconocido")
    enlace = _enlace_valido(db, token)
    acta = _acta_de(db, enlace)
    png = _decodificar_png(data.imagen)
    p = (acta.snapshot or {}).get("paciente", {})

    for previa in db.scalars(select(ActaFirma).where(ActaFirma.acta_id == acta.id, ActaFirma.rol == "PACIENTE")):
        db.delete(previa)
    db.flush()
    ahora = datetime.now(timezone.utc)
    ip = request.client.host if request.client else None
    db.add(ActaFirma(acta_id=acta.id, rol="PACIENTE",
                     firmante_nombre=p.get("nombre_completo") or acta.paciente.nombre_completo,
                     firmante_documento=p.get("numero_documento") or acta.paciente.numero_documento,
                     imagen_png=png, firmado_en=ahora, ip=ip))
    enlace.usado_en = ahora
    db.flush()
    if ROLES_REQUERIDOS <= set(_estado(db, acta).roles_firmados):
        acta.estado = "FIRMADA"
    db.add(Auditoria(accion="FIRMA_REMOTA", entidad="acta", entidad_id=str(acta.id),
                     detalle={"rol": "PACIENTE"}, ip=ip))
    db.commit()
    return {"ok": True}