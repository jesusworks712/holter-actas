from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models import Auditoria, Usuario
from app.schemas.usuario import AuditoriaOut

router = APIRouter(prefix="/auditoria", tags=["auditoria"])

COLOMBIA = timezone(timedelta(hours=-5))


def rango(desde: date | None, hasta: date | None):
    ini = datetime.combine(desde, time.min, COLOMBIA) if desde else None
    fin = datetime.combine(hasta + timedelta(days=1), time.min, COLOMBIA) if hasta else None
    return ini, fin


@router.get("/acciones", response_model=list[str])
def acciones(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return list(db.scalars(select(Auditoria.accion).distinct().order_by(Auditoria.accion)).all())


@router.get("", response_model=list[AuditoriaOut])
def listar(accion: str | None = None, usuario: str | None = Query(None, description="Texto del usuario o nombre"),
           desde: date | None = None, hasta: date | None = None,
           limit: int = Query(100, le=500), offset: int = 0,
           db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    stmt = select(Auditoria, Usuario).outerjoin(Usuario, Usuario.id == Auditoria.usuario_id)
    if accion:
        stmt = stmt.where(Auditoria.accion == accion)
    if usuario:
        like = f"%{usuario.strip()}%"
        stmt = stmt.where(Usuario.username.ilike(like) | Usuario.nombre.ilike(like))
    ini, fin = rango(desde, hasta)
    if ini:
        stmt = stmt.where(Auditoria.created_at >= ini)
    if fin:
        stmt = stmt.where(Auditoria.created_at < fin)
    filas = db.execute(stmt.order_by(Auditoria.created_at.desc(), Auditoria.id.desc()).limit(limit).offset(offset)).all()
    return [
        AuditoriaOut(id=a.id, fecha=a.created_at, usuario=u.nombre if u else None, username=u.username if u else None,
                     accion=a.accion, entidad=a.entidad, entidad_id=a.entidad_id, detalle=a.detalle, ip=a.ip)
        for a, u in filas
    ]
