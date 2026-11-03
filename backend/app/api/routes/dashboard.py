from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db
from app.models import Acta, Equipo, TipoEquipo, Usuario

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
COLOMBIA = timezone(timedelta(hours=-5))
ABIERTAS = ("FIRMADA", "ENVIADA")


def _aware(d: datetime) -> datetime:
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


@router.get("")
def resumen(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    ahora = datetime.now(timezone.utc)
    hoy = ahora.astimezone(COLOMBIA).date()

    equipos = dict(db.execute(select(Equipo.estado, func.count()).group_by(Equipo.estado)).all())
    actas = dict(db.execute(select(Acta.estado, func.count()).group_by(Acta.estado)).all())
    prevista = Acta.fecha_devolucion_prevista
    vencidas = db.scalar(select(func.count()).select_from(Acta).where(Acta.estado.in_(ABIERTAS), prevista < ahora))
    por_vencer = db.scalar(select(func.count()).select_from(Acta).where(
        Acta.estado.in_(ABIERTAS), prevista >= ahora, prevista < ahora + timedelta(hours=24)))

    inicio = datetime.combine(hoy - timedelta(days=13), datetime.min.time(), COLOMBIA)
    fechas = db.scalars(select(Acta.fecha_entrega).where(Acta.fecha_entrega >= inicio, Acta.estado != "ANULADA")).all()
    por_dia = Counter(_aware(f).astimezone(COLOMBIA).date() for f in fechas)
    serie = [{"fecha": (hoy - timedelta(days=i)).isoformat(), "total": por_dia.get(hoy - timedelta(days=i), 0)}
             for i in range(13, -1, -1)]

    top = db.execute(
        select(TipoEquipo.nombre, Equipo.serie, func.count(Acta.id).label("n"))
        .join(Equipo, Equipo.id == Acta.equipo_id).join(TipoEquipo, TipoEquipo.id == Equipo.tipo_equipo_id)
        .where(Acta.estado != "ANULADA", Acta.fecha_entrega >= ahora - timedelta(days=90))
        .group_by(TipoEquipo.nombre, Equipo.serie).order_by(func.count(Acta.id).desc()).limit(5)
    ).all()

    return {
        "equipos": equipos,
        "actas": actas,
        "vencidas": vencidas,
        "por_vencer_24h": por_vencer,
        "prestamos_14_dias": serie,
        "top_equipos": [{"nombre": f"{n} {s}", "total": c} for n, s, c in top],
    }


@router.get("/vencidas")
def lista_vencidas(
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Lista detallada de actas vencidas con teléfono del paciente, para gestión operativa."""
    ahora = datetime.now(timezone.utc)

    actas = db.scalars(
        select(Acta)
        .options(joinedload(Acta.equipo).joinedload(Equipo.tipo), joinedload(Acta.paciente))
        .where(
            Acta.estado.in_(ABIERTAS),
            Acta.fecha_devolucion_prevista < ahora,
        )
        .order_by(Acta.fecha_devolucion_prevista)
        .limit(limit)
        .offset(offset)
    ).unique().all()

    resultado = []
    for a in actas:
        snap = a.snapshot or {}
        pac_snap = snap.get("paciente", {})
        eq_snap = snap.get("equipo", {})

        # Teléfono: preferir el del snapshot; si no, el del paciente actual
        telefono = (
            pac_snap.get("telefono")
            or (a.paciente.telefono if a.paciente else None)
        )

        dias_vencida = (ahora - _aware(a.fecha_devolucion_prevista)).days if a.fecha_devolucion_prevista else None

        resultado.append({
            "acta_id": str(a.id),
            "numero": a.numero,
            "estado": a.estado,
            "paciente_nombre": pac_snap.get("nombre_completo") or (a.paciente.nombre_completo if a.paciente else "—"),
            "paciente_documento": pac_snap.get("numero_documento") or (a.paciente.numero_documento if a.paciente else "—"),
            "paciente_correo": pac_snap.get("correo") or (a.paciente.correo if a.paciente else None),
            "paciente_telefono": telefono,
            "equipo_tipo": eq_snap.get("tipo_nombre") or eq_snap.get("tipo", ""),
            "equipo_serie": eq_snap.get("serie") or (a.equipo.serie if a.equipo else "—"),
            "fecha_entrega": a.fecha_entrega.isoformat() if a.fecha_entrega else None,
            "fecha_devolucion_prevista": a.fecha_devolucion_prevista.isoformat() if a.fecha_devolucion_prevista else None,
            "dias_vencida": dias_vencida,
        })

    return resultado
