import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db
from app.models import Acta, ActaFirma, Aseguradora, Auditoria, Equipo, Paciente, Regimen, Usuario
from app.core.config import settings
from app.schemas.acta import ActaAnular, ActaCorregir, ActaCreate, ActaDevolver, ActaOut

router = APIRouter(prefix="/actas", tags=["actas"])

_CARGA = (joinedload(Acta.paciente), joinedload(Acta.equipo).joinedload(Equipo.tipo))

ABIERTAS = ("BORRADOR", "FIRMADA", "ENVIADA")


def _get_or_404(db: Session, acta_id: uuid.UUID) -> Acta:
    acta = db.scalar(select(Acta).options(*_CARGA).where(Acta.id == acta_id))
    if not acta:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Acta no encontrada")
    return acta


@router.post("", response_model=ActaOut, status_code=201)
def crear(data: ActaCreate, request: Request, db: Session = Depends(get_db),
          user: Usuario = Depends(get_current_user)):
    paciente = db.get(Paciente, data.paciente_id)
    if not paciente or paciente.deleted_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paciente no encontrado")

    # ── Mejora: verificar si el paciente ya tiene un préstamo activo ──────────
    prestamo_activo = db.scalar(
        select(Acta).where(
            Acta.paciente_id == paciente.id,
            Acta.estado.in_(ABIERTAS),
        ).limit(1)
    )
    if prestamo_activo:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"El paciente ya tiene un préstamo activo (acta #{prestamo_activo.numero}, "
            f"estado: {prestamo_activo.estado}). Devuelva ese equipo antes de crear uno nuevo.",
        )

    equipo = db.scalar(
        select(Equipo)
        .options(joinedload(Equipo.tipo))
        .where(Equipo.id == data.equipo_id)
        .with_for_update(of=Equipo)
    )
    if not equipo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Equipo no encontrado")
    if equipo.estado != "DISPONIBLE":
        raise HTTPException(status.HTTP_409_CONFLICT, f"El equipo no está disponible (estado: {equipo.estado})")

    aseguradora = regimen = None
    if data.aseguradora_id:
        aseguradora = db.get(Aseguradora, data.aseguradora_id)
        if not aseguradora:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Aseguradora no válida")
    if data.regimen_id:
        regimen = db.get(Regimen, data.regimen_id)
        if not regimen:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Régimen no válido")

    acta = Acta(
        paciente_id=paciente.id,
        equipo_id=equipo.id,
        creado_por=user.id,
        aseguradora_id=data.aseguradora_id,
        regimen_id=data.regimen_id,
        fecha_entrega=data.fecha_entrega,
        duracion_horas=data.duracion_horas,
        fecha_devolucion_prevista=data.fecha_entrega + timedelta(hours=data.duracion_horas),
        observaciones=data.observaciones,
        # ── Mejora: teléfono incluido en el snapshot ───────────────────────────
        snapshot={
            "paciente": {
                "tipo_documento": paciente.tipo_documento,
                "numero_documento": paciente.numero_documento,
                "nombre_completo": paciente.nombre_completo,
                "ciudad_expedicion": paciente.ciudad_expedicion,
                "vecino_de": paciente.vecino_de,
                "correo": paciente.correo,
                "telefono": paciente.telefono,   # ← nuevo
            },
            "equipo": {
                "tipo": equipo.tipo.codigo,
                "tipo_nombre": equipo.tipo.nombre,
                "marca": equipo.marca or equipo.tipo.marca,
                "modelo": equipo.modelo,
                "serie": equipo.serie,
            },
            "aseguradora": aseguradora.nombre if aseguradora else None,
            "regimen": regimen.nombre if regimen else None,
        },
    )
    db.add(acta)
    equipo.estado = "PRESTADO"
    db.flush()
    ip = request.client.host if request.client else None
    db.add(Auditoria(usuario_id=user.id, accion="CREAR_ACTA", entidad="acta", entidad_id=str(acta.id), ip=ip))
    if user.tiene_firma and user.firma_png:
        db.add(ActaFirma(
            acta_id=acta.id, rol="ENFERMERA",
            firmante_nombre=user.nombre, firmante_documento=user.documento,
            imagen_png=user.firma_png, firmado_en=datetime.now(timezone.utc), ip=ip,
        ))
        db.add(Auditoria(
            usuario_id=user.id, accion="FIRMAR_ACTA", entidad="acta", entidad_id=str(acta.id),
            detalle={"rol": "ENFERMERA", "firma_guardada": True}, ip=ip,
        ))
    db.commit()
    return _get_or_404(db, acta.id)


@router.get("", response_model=list[ActaOut])
def listar(
    estado: str | None = None,
    q: str | None = Query(None, description="Documento o nombre del paciente"),
    vencidas: bool = Query(False, description="Solo actas vencidas (fecha_devolucion_prevista < ahora)"),
    limit: int = Query(20, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    stmt = select(Acta).join(Acta.paciente).options(*_CARGA)
    if estado:
        stmt = stmt.where(Acta.estado == estado.upper())
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Paciente.numero_documento.ilike(like), Paciente.nombre_completo.ilike(like)))
    # ── Mejora: filtro de vencidas ─────────────────────────────────────────────
    if vencidas:
        ahora = datetime.now(timezone.utc)
        stmt = stmt.where(
            Acta.estado.in_(("FIRMADA", "ENVIADA")),
            Acta.fecha_devolucion_prevista < ahora,
        )
    return db.scalars(stmt.order_by(Acta.numero.desc()).limit(limit).offset(offset)).unique().all()

@router.get("/paciente/{paciente_id}/abierta", response_model=ActaOut | None)
def abierta_de_paciente(paciente_id: uuid.UUID, db: Session = Depends(get_db),
                        _: Usuario = Depends(get_current_user)):
    """Acta abierta (BORRADOR, FIRMADA o ENVIADA) de ESE paciente, o null si no tiene préstamo activo."""
    return db.scalars(
        select(Acta).where(Acta.paciente_id == paciente_id, Acta.estado.in_(ABIERTAS))
        .options(*_CARGA).order_by(Acta.numero.desc()).limit(1)
    ).unique().first()

@router.get("/{acta_id}", response_model=ActaOut)
def obtener(acta_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return _get_or_404(db, acta_id)


@router.post("/{acta_id}/anular", response_model=ActaOut)
def anular(acta_id: uuid.UUID, data: ActaAnular, request: Request, db: Session = Depends(get_db),
           user: Usuario = Depends(get_current_user)):
    acta = _get_or_404(db, acta_id)
    if acta.estado in ("ANULADA", "DEVUELTA"):
        raise HTTPException(status.HTTP_409_CONFLICT, f"No se puede anular un acta {acta.estado}")
    acta.estado = "ANULADA"
    previas = f"{acta.observaciones}\n" if acta.observaciones else ""
    acta.observaciones = f"{previas}ANULADA: {data.motivo}"
    if acta.equipo.estado == "PRESTADO":
        acta.equipo.estado = "DISPONIBLE"
    db.add(Auditoria(
        usuario_id=user.id, accion="ANULAR_ACTA", entidad="acta", entidad_id=str(acta.id),
        detalle={"motivo": data.motivo}, ip=request.client.host if request.client else None,
    ))
    db.commit()
    return _get_or_404(db, acta.id)


def _invalidar_pdf(acta: Acta) -> None:
    """El PDF guardado ya no refleja los datos: se borra para que se genere de nuevo."""
    if acta.pdf_path:
        (settings.pdf_dir / acta.pdf_path).unlink(missing_ok=True)
    acta.pdf_path = None
    acta.pdf_sha256 = None


@router.put("/{acta_id}/corregir", response_model=ActaOut)
def corregir(acta_id: uuid.UUID, data: ActaCorregir, request: Request, db: Session = Depends(get_db),
             user: Usuario = Depends(get_current_user)):
    acta = _get_or_404(db, acta_id)
    if acta.estado not in ("BORRADOR", "FIRMADA"):
        raise HTTPException(status.HTTP_409_CONFLICT,
                            "Solo se puede corregir un acta que todavía no se ha enviado")

    aseguradora = regimen = None
    if data.aseguradora_id:
        aseguradora = db.get(Aseguradora, data.aseguradora_id)
        if not aseguradora:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Aseguradora no válida")
    if data.regimen_id:
        regimen = db.get(Regimen, data.regimen_id)
        if not regimen:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Régimen no válido")

    # ── Mejora: la corrección SOLO toca el snapshot y los campos del acta ─────
    # El objeto Paciente en la BD NO se modifica, así que sus otras actas no se ven afectadas.
    snap = dict(acta.snapshot or {})
    snap_pac_anterior = dict(snap.get("paciente", {}))

    nuevo_snap_pac = {
        "tipo_documento": data.tipo_documento,
        "numero_documento": data.numero_documento,
        "nombre_completo": data.nombre_completo,
        "ciudad_expedicion": data.ciudad_expedicion or None,
        "vecino_de": data.vecino_de or None,
        "correo": str(data.correo) if data.correo else None,
        "telefono": data.telefono or None,
    }

    cambios: dict = {}
    for k, v in nuevo_snap_pac.items():
        ant = snap_pac_anterior.get(k)
        if ant != v:
            cambios[k] = [ant, v]
    for campo, valor in (
        ("fecha_entrega", data.fecha_entrega),
        ("duracion_horas", data.duracion_horas),
        ("aseguradora_id", data.aseguradora_id),
        ("regimen_id", data.regimen_id),
        ("observaciones", data.observaciones or None),
    ):
        actual = getattr(acta, campo)
        if actual != valor:
            cambios[campo] = [str(actual), str(valor)]

    # Actualizar solo el snapshot (no el Paciente real)
    snap["paciente"] = nuevo_snap_pac
    snap["aseguradora"] = aseguradora.nombre if aseguradora else None
    snap["regimen"] = regimen.nombre if regimen else None
    acta.snapshot = snap  # reasignar para que SQLAlchemy detecte el cambio del JSON

    acta.fecha_entrega = data.fecha_entrega
    acta.duracion_horas = data.duracion_horas
    acta.fecha_devolucion_prevista = data.fecha_entrega + timedelta(hours=data.duracion_horas)
    acta.aseguradora_id = data.aseguradora_id
    acta.regimen_id = data.regimen_id
    acta.observaciones = data.observaciones or None

    _invalidar_pdf(acta)
    db.add(Auditoria(
        usuario_id=user.id, accion="CORREGIR_ACTA", entidad="acta", entidad_id=str(acta.id),
        detalle={"cambios": cambios, "nota": "solo se modificó el snapshot, no el paciente en BD"},
        ip=request.client.host if request.client else None,
    ))
    db.commit()
    return _get_or_404(db, acta.id)


@router.post("/{acta_id}/devolver", response_model=ActaOut)
def devolver(acta_id: uuid.UUID, data: ActaDevolver, request: Request, db: Session = Depends(get_db),
             user: Usuario = Depends(get_current_user)):
    acta = _get_or_404(db, acta_id)
    if acta.estado not in ("FIRMADA", "ENVIADA"):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Solo se puede devolver un acta FIRMADA o ENVIADA (estado actual: {acta.estado})",
        )

    acta.estado = "DEVUELTA"
    acta.fecha_devolucion_real = datetime.now(timezone.utc)
    if data.observaciones:
        previas = f"{acta.observaciones}\n" if acta.observaciones else ""
        acta.observaciones = f"{previas}Devolución: {data.observaciones}"
    acta.equipo.estado = data.estado_equipo

    db.add(Auditoria(
        usuario_id=user.id, accion="DEVOLVER_ACTA", entidad="acta", entidad_id=str(acta.id),
        detalle={"estado_equipo": data.estado_equipo, "recibio": user.nombre},
        ip=request.client.host if request.client else None,
    ))
    db.commit()
    return _get_or_404(db, acta.id)
