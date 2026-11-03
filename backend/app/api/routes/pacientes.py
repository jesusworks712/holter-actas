import uuid

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db
from app.models import Acta, Auditoria, Equipo, Paciente, Usuario
from app.schemas.paciente import (
    HistorialPacienteItem, PacienteCreate, PacienteOut, PacientesPagina, PacienteResumen, PacienteUpdate,
)

router = APIRouter(prefix="/pacientes", tags=["pacientes"])


def _get_or_404(db: Session, paciente_id: uuid.UUID) -> Paciente:
    p = db.get(Paciente, paciente_id)
    if not p or p.deleted_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paciente no encontrado")
    return p


@router.get("", response_model=list[PacienteOut])
def buscar(q: str | None = Query(None, description="Documento o nombre"),
           limit: int = Query(20, le=100),
           db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    stmt = select(Paciente).where(Paciente.deleted_at.is_(None))
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Paciente.numero_documento.ilike(like), Paciente.nombre_completo.ilike(like)))
    return db.scalars(stmt.order_by(Paciente.nombre_completo).limit(limit)).all()


@router.post("", response_model=PacienteOut, status_code=201)
def crear(data: PacienteCreate, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    paciente = Paciente(**data.model_dump())
    db.add(paciente)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un paciente con ese documento")
    db.add(Auditoria(usuario_id=user.id, accion="CREAR_PACIENTE", entidad="paciente", entidad_id=str(paciente.id)))
    db.commit()
    return paciente


@router.get("/listado", response_model=PacientesPagina)
def listado(q: str | None = None, orden: Literal["nombre", "reciente", "prestamos"] = "nombre",
            solo_en_prestamo: bool = False, limit: int = Query(25, le=100), offset: int = 0,
            db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    """Todos los pacientes registrados, con cuántos préstamos tienen y si ahora tienen un equipo."""
    stats = (
        select(Acta.paciente_id.label("pid"), func.count(Acta.id).label("n"), func.max(Acta.fecha_entrega).label("ultimo"),
               func.sum(case((Acta.estado.in_(("BORRADOR", "FIRMADA", "ENVIADA")), 1), else_=0)).label("abiertas"))
        .where(Acta.estado != "ANULADA").group_by(Acta.paciente_id).subquery()
    )
    base = select(Paciente, func.coalesce(stats.c.n, 0), stats.c.ultimo, func.coalesce(stats.c.abiertas, 0)) \
        .outerjoin(stats, stats.c.pid == Paciente.id).where(Paciente.deleted_at.is_(None))
    if q and q.strip():
        like = f"%{q.strip()}%"
        base = base.where(or_(Paciente.numero_documento.ilike(like), Paciente.nombre_completo.ilike(like),
                              Paciente.correo.ilike(like)))
    if solo_en_prestamo:
        base = base.where(func.coalesce(stats.c.abiertas, 0) > 0)

    total = db.scalar(select(func.count()).select_from(base.subquery()))
    orden_sql = {
        "nombre": (Paciente.nombre_completo,),
        "reciente": (stats.c.ultimo.desc().nulls_last(), Paciente.nombre_completo),
        "prestamos": (func.coalesce(stats.c.n, 0).desc(), Paciente.nombre_completo),
    }[orden]
    filas = db.execute(base.order_by(*orden_sql).limit(limit).offset(offset)).all()
    items = [PacienteResumen(**PacienteOut.model_validate(p).model_dump(), total_prestamos=n, ultimo_prestamo=ultimo,
                             en_prestamo=bool(abiertas)) for p, n, ultimo, abiertas in filas]
    return PacientesPagina(total=total, items=items)


@router.get("/{paciente_id}", response_model=PacienteOut)
def obtener(paciente_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return _get_or_404(db, paciente_id)


@router.put("/{paciente_id}", response_model=PacienteOut)
def actualizar(paciente_id: uuid.UUID, data: PacienteUpdate, db: Session = Depends(get_db),
               user: Usuario = Depends(get_current_user)):
    paciente = _get_or_404(db, paciente_id)
    for campo, valor in data.model_dump().items():
        setattr(paciente, campo, valor)
    db.add(Auditoria(usuario_id=user.id, accion="EDITAR_PACIENTE", entidad="paciente", entidad_id=str(paciente.id)))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un paciente con ese documento")
    return paciente


@router.get("/{paciente_id}/historial", response_model=list[HistorialPacienteItem])
def historial(paciente_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    _get_or_404(db, paciente_id)
    actas = db.scalars(
        select(Acta).options(joinedload(Acta.equipo).joinedload(Equipo.tipo))
        .where(Acta.paciente_id == paciente_id).order_by(Acta.numero.desc())
    ).unique().all()
    return [
        HistorialPacienteItem(
            acta_id=a.id, numero=a.numero, estado=a.estado, equipo=f"{a.equipo.tipo.nombre} serie {a.equipo.serie}",
            fecha_entrega=a.fecha_entrega, fecha_devolucion_prevista=a.fecha_devolucion_prevista,
            fecha_devolucion_real=a.fecha_devolucion_real,
        )
        for a in actas
    ]
