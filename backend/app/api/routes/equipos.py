import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse, Response
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db, require_admin
from app.core.config import settings
from app.models import Acta, Auditoria, Equipo, Paciente, TipoEquipo, Usuario
from app.services.qr import qr_png
from app.schemas.equipo import (
    EquipoCreate, EquipoOut, EquipoUpdate, HistorialEquipoItem, TipoEquipoOut,
)

router = APIRouter(prefix="/equipos", tags=["equipos"])

MAX_FOTO_BYTES = 8 * 1024 * 1024


def _get_or_404(db: Session, equipo_id: uuid.UUID) -> Equipo:
    e = db.scalar(select(Equipo).options(joinedload(Equipo.tipo)).where(Equipo.id == equipo_id))
    if not e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Equipo no encontrado")
    return e


def _validar_tipo(db: Session, tipo_id: int):
    tipo = db.get(TipoEquipo, tipo_id)
    if not tipo or not tipo.activo:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tipo de equipo no válido")


def _borrar_foto(equipo: Equipo) -> None:
    if equipo.foto_path:
        (settings.fotos_dir / equipo.foto_path).unlink(missing_ok=True)
    equipo.foto_path = None


@router.get("/tipos", response_model=list[TipoEquipoOut])
def tipos(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return db.scalars(select(TipoEquipo).where(TipoEquipo.activo.is_(True)).order_by(TipoEquipo.nombre)).all()


@router.get("", response_model=list[EquipoOut])
def listar(estado: str | None = Query(None, description="DISPONIBLE, PRESTADO, MANTENIMIENTO, BAJA"),
           tipo_equipo_id: int | None = None,
           db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    stmt = select(Equipo).options(joinedload(Equipo.tipo))
    if estado:
        stmt = stmt.where(Equipo.estado == estado.upper())
    if tipo_equipo_id:
        stmt = stmt.where(Equipo.tipo_equipo_id == tipo_equipo_id)
    return db.scalars(stmt.order_by(Equipo.serie)).all()


@router.post("", response_model=EquipoOut, status_code=201)
def crear(data: EquipoCreate, db: Session = Depends(get_db), user: Usuario = Depends(require_admin)):
    _validar_tipo(db, data.tipo_equipo_id)
    datos = data.model_dump()
    datos["serie"] = datos["serie"].strip()
    equipo = Equipo(**datos)
    db.add(equipo)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un equipo con esa serie")
    db.add(Auditoria(usuario_id=user.id, accion="CREAR_EQUIPO", entidad="equipo", entidad_id=str(equipo.id),
                     detalle={"serie": equipo.serie}))
    db.commit()
    return _get_or_404(db, equipo.id)


@router.put("/{equipo_id}", response_model=EquipoOut)
def actualizar(equipo_id: uuid.UUID, data: EquipoUpdate, db: Session = Depends(get_db),
               user: Usuario = Depends(require_admin)):
    equipo = _get_or_404(db, equipo_id)
    _validar_tipo(db, data.tipo_equipo_id)

    # PRESTADO solo lo maneja el sistema: se pone al crear el acta y se quita al devolver o anular.
    if equipo.estado == "PRESTADO" and data.estado != "PRESTADO":
        raise HTTPException(status.HTTP_409_CONFLICT,
                            "El equipo está prestado. Para liberarlo registra la devolución (o anula el acta) en el inicio.")
    if equipo.estado != "PRESTADO" and data.estado == "PRESTADO":
        raise HTTPException(status.HTTP_409_CONFLICT, "El estado «Prestado» se asigna al crear un acta de préstamo.")

    antes = {c: getattr(equipo, c) for c in ("tipo_equipo_id", "serie", "marca", "modelo", "notas", "estado")}
    for campo, valor in data.model_dump().items():
        setattr(equipo, campo, valor.strip() if isinstance(valor, str) else valor)
    cambios = {c: [v, getattr(equipo, c)] for c, v in antes.items() if getattr(equipo, c) != v}
    db.add(Auditoria(usuario_id=user.id, accion="EDITAR_EQUIPO", entidad="equipo", entidad_id=str(equipo.id),
                     detalle={"cambios": cambios}))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un equipo con esa serie")
    return _get_or_404(db, equipo.id)


@router.delete("/{equipo_id}", status_code=204)
def eliminar(equipo_id: uuid.UUID, db: Session = Depends(get_db), user: Usuario = Depends(require_admin)):
    equipo = _get_or_404(db, equipo_id)
    prestamos = db.scalar(select(func.count()).select_from(Acta).where(Acta.equipo_id == equipo.id))
    if prestamos:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Este equipo tiene {prestamos} acta(s) en su historial y no se puede eliminar. "
            "Cámbialo a «De baja» para dejar de usarlo sin perder el historial.",
        )
    serie = equipo.serie
    _borrar_foto(equipo)
    db.delete(equipo)
    db.add(Auditoria(usuario_id=user.id, accion="ELIMINAR_EQUIPO", entidad="equipo", entidad_id=str(equipo_id),
                     detalle={"serie": serie}))
    db.commit()


# ---------- Foto ----------
@router.post("/{equipo_id}/foto", response_model=EquipoOut)
async def subir_foto(equipo_id: uuid.UUID, archivo: UploadFile = File(...), db: Session = Depends(get_db),
                     user: Usuario = Depends(require_admin)):
    equipo = _get_or_404(db, equipo_id)
    contenido = await archivo.read(MAX_FOTO_BYTES + 1)
    if len(contenido) > MAX_FOTO_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "La foto pesa más de 8 MB")
    try:
        img = Image.open(io.BytesIO(contenido))
        img.load()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El archivo no es una imagen válida (usa JPG, PNG o WEBP)")

    # Se vuelve a codificar: corrige la rotación, quita metadatos (GPS, etc.) y reduce el peso.
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((1000, 1000))
    settings.fotos_dir.mkdir(parents=True, exist_ok=True)
    _borrar_foto(equipo)
    nombre = f"{equipo.id}-{uuid.uuid4().hex[:8]}.jpg"  # nombre nuevo: el navegador no usa una versión vieja en caché
    img.save(settings.fotos_dir / nombre, "JPEG", quality=85, optimize=True)
    equipo.foto_path = nombre
    db.add(Auditoria(usuario_id=user.id, accion="FOTO_EQUIPO", entidad="equipo", entidad_id=str(equipo.id)))
    db.commit()
    return _get_or_404(db, equipo.id)


@router.get("/{equipo_id}/foto")
def ver_foto(equipo_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    equipo = _get_or_404(db, equipo_id)
    ruta = settings.fotos_dir / equipo.foto_path if equipo.foto_path else None
    if not ruta or not ruta.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "El equipo no tiene foto")
    return FileResponse(ruta, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=3600"})


@router.delete("/{equipo_id}/foto", response_model=EquipoOut)
def quitar_foto(equipo_id: uuid.UUID, db: Session = Depends(get_db), user: Usuario = Depends(require_admin)):
    equipo = _get_or_404(db, equipo_id)
    _borrar_foto(equipo)
    db.add(Auditoria(usuario_id=user.id, accion="QUITAR_FOTO_EQUIPO", entidad="equipo", entidad_id=str(equipo.id)))
    db.commit()
    return _get_or_404(db, equipo.id)


# ---------- Historial ----------
@router.get("/{equipo_id}/historial", response_model=list[HistorialEquipoItem])
def historial(equipo_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    _get_or_404(db, equipo_id)
    filas = db.execute(
        select(Acta, Paciente.nombre_completo, Paciente.numero_documento)
        .join(Paciente, Paciente.id == Acta.paciente_id)
        .where(Acta.equipo_id == equipo_id)
        .order_by(Acta.numero.desc())
    ).all()
    return [
        HistorialEquipoItem(
            acta_id=a.id, numero=a.numero, estado=a.estado,
            paciente_nombre=(a.snapshot or {}).get("paciente", {}).get("nombre_completo") or nombre,
            paciente_documento=(a.snapshot or {}).get("paciente", {}).get("numero_documento") or doc,
            fecha_entrega=a.fecha_entrega, fecha_devolucion_prevista=a.fecha_devolucion_prevista,
            fecha_devolucion_real=a.fecha_devolucion_real,
        )
        for a, nombre, doc in filas
    ]


# ---------- QR ----------
@router.get("/{equipo_id}/qr.png")
def qr(equipo_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    """QR de la ficha del equipo: al escanearlo abre su historial y permite iniciar un acta."""
    equipo = _get_or_404(db, equipo_id)
    return Response(qr_png(f"{settings.APP_URL.rstrip('/')}/#/equipo/{equipo.id}"), media_type="image/png",
                    headers={"Cache-Control": "private, max-age=3600"})
