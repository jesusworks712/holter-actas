import base64
import binascii
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import Acta, ActaFirma, Auditoria, Usuario
from app.schemas.firma import FirmaCreate, FirmaResumen, FirmasEstado

router = APIRouter(prefix="/actas", tags=["firmas"])

ROLES_REQUERIDOS = {"PACIENTE", "ENFERMERA"}
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
MAX_BYTES = 300_000


def _decodificar_png(imagen: str) -> bytes:
    if imagen.startswith("data:"):
        imagen = imagen.split(",", 1)[-1]
    try:
        data = base64.b64decode(imagen, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La firma no es una imagen válida")
    if not data.startswith(PNG_MAGIC):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La firma debe ser una imagen PNG")
    if len(data) > MAX_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La imagen de la firma es demasiado grande")
    return data


def _estado(db: Session, acta: Acta) -> FirmasEstado:
    roles = sorted(db.scalars(select(ActaFirma.rol).where(ActaFirma.acta_id == acta.id)).all())
    return FirmasEstado(estado=acta.estado, roles_firmados=roles, completa=ROLES_REQUERIDOS <= set(roles))


@router.post("/{acta_id}/firmas", response_model=FirmasEstado, status_code=201)
def firmar(acta_id: uuid.UUID, data: FirmaCreate, request: Request, db: Session = Depends(get_db),
           user: Usuario = Depends(get_current_user)):
    acta = db.get(Acta, acta_id)
    if not acta:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Acta no encontrada")
    if acta.estado not in ("BORRADOR", "FIRMADA"):
        raise HTTPException(status.HTTP_409_CONFLICT, f"No se puede firmar un acta {acta.estado}")

    # Si el paciente no puede firmar, la imagen es opcional (solo la firma del responsable, si la hay).
    png = _decodificar_png(data.imagen) if data.imagen else None

    # Si ya existía la firma de ese rol, se reemplaza (por si se equivocaron al firmar).
    for previa in db.scalars(select(ActaFirma).where(ActaFirma.acta_id == acta.id, ActaFirma.rol == data.rol)):
        db.delete(previa)
    db.flush()

    db.add(ActaFirma(
        acta_id=acta.id, rol=data.rol,
        firmante_nombre=data.firmante_nombre, firmante_documento=data.firmante_documento,
        imagen_png=png, firmado_en=datetime.now(timezone.utc),
        ip=request.client.host if request.client else None,
        motivo_no_firma=data.motivo_no_firma if data.no_puede_firmar else None,
        responsable_nombre=data.responsable_nombre if data.no_puede_firmar else None,
        responsable_documento=data.responsable_documento if data.no_puede_firmar else None,
    ))
    db.flush()

    estado = _estado(db, acta)
    if estado.completa:
        acta.estado = "FIRMADA"
    db.add(Auditoria(usuario_id=user.id, accion="FIRMAR_ACTA", entidad="acta", entidad_id=str(acta.id),
                     detalle={"rol": data.rol, **({"no_puede_firmar": True, "motivo": data.motivo_no_firma} if data.no_puede_firmar else {})}))
    db.commit()
    return _estado(db, acta)


@router.get("/{acta_id}/firmas", response_model=list[FirmaResumen])
def listar_firmas(acta_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    if not db.get(Acta, acta_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Acta no encontrada")
    return db.scalars(select(ActaFirma).where(ActaFirma.acta_id == acta_id).order_by(ActaFirma.firmado_en)).all()