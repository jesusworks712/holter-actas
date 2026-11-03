"""
Recordatorios automáticos y alertas de vencidas.

Se lanza una sola vez al arrancar (desde programador.py).
Usa APScheduler (ya incluido en requirements.txt).
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import Acta, Equipo
from app.services.correo import enviar_correo

log = logging.getLogger(__name__)

COLOMBIA = timezone(timedelta(hours=-5))
ABIERTAS = ("FIRMADA", "ENVIADA")


# ---------------------------------------------------------------------------
# Tarea 1: recordatorio al paciente X horas antes de la devolución
# ---------------------------------------------------------------------------

def _enviar_recordatorio(acta: Acta, db: Session) -> None:
    snap = acta.snapshot or {}
    pac = snap.get("paciente", {})
    eq = snap.get("equipo", {})

    correo = pac.get("correo")
    if not correo:
        return

    nombre = pac.get("nombre_completo", "Paciente")
    tipo_eq = eq.get("tipo_nombre") or eq.get("tipo", "Holter")
    serie = eq.get("serie", "")
    prevista = acta.fecha_devolucion_prevista
    if not prevista:
        return

    prevista_col = prevista.astimezone(COLOMBIA)
    fecha_str = prevista_col.strftime("%d/%m/%Y a las %-I:%M %p").replace("AM", "a.m.").replace("PM", "p.m.")

    asunto = f"Recordatorio: devolución de su {tipo_eq} — IPS Nueva Popayán"
    cuerpo = (
        f"<p>Estimado/a <b>{nombre}</b>,</p>"
        f"<p>Le recordamos que debe devolver el <b>{tipo_eq}"
        f"{' serie ' + serie if serie else ''}</b> a más tardar el <b>{fecha_str}</b>.</p>"
        f"<p>Por favor, acérquese a nuestras instalaciones a tiempo. Si tiene alguna duda, "
        f"comuníquese con nosotros.</p>"
        f"<p>Gracias,<br/><b>IPS Nueva Popayán — Rehabilitar</b></p>"
    )

    try:
        enviar_correo(destinatario=correo, asunto=asunto, html=cuerpo)
        acta.recordatorio_enviado_en = datetime.now(timezone.utc)
        db.commit()
        log.info("Recordatorio enviado: acta #%s → %s", acta.numero, correo)
    except Exception as exc:  # noqa: BLE001
        log.warning("No se pudo enviar recordatorio acta #%s: %s", acta.numero, exc)
        db.rollback()


def tarea_recordatorios() -> None:
    """Revisa actas abiertas y envía recordatorio cuando faltan X horas para la devolución."""
    if not settings.SCHEDULER_ACTIVO:
        return

    ahora = datetime.now(timezone.utc)
    ventana_inicio = ahora  # ya se acerca
    ventana_fin = ahora + timedelta(hours=settings.RECORDATORIO_HORAS_ANTES)

    db: Session = SessionLocal()
    try:
        actas = db.scalars(
            select(Acta)
            .options(joinedload(Acta.equipo).joinedload(Equipo.tipo))
            .where(
                Acta.estado.in_(ABIERTAS),
                Acta.recordatorio_enviado_en.is_(None),
                Acta.fecha_devolucion_prevista >= ventana_inicio,
                Acta.fecha_devolucion_prevista <= ventana_fin,
            )
        ).all()

        for acta in actas:
            _enviar_recordatorio(acta, db)

        if actas:
            log.info("Recordatorios procesados: %d acta(s)", len(actas))
    except Exception as exc:  # noqa: BLE001
        log.error("Error en tarea_recordatorios: %s", exc)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Tarea 2: resumen diario de actas vencidas al personal
# ---------------------------------------------------------------------------

def tarea_alertas_vencidas() -> None:
    """Envía un resumen de equipos vencidos a los correos configurados en ALERTAS_EMAIL."""
    if not settings.SCHEDULER_ACTIVO:
        return
    if not settings.alertas_lista:
        return

    ahora = datetime.now(timezone.utc)

    db: Session = SessionLocal()
    try:
        actas = db.scalars(
            select(Acta)
            .options(joinedload(Acta.equipo).joinedload(Equipo.tipo))
            .where(
                Acta.estado.in_(ABIERTAS),
                Acta.fecha_devolucion_prevista < ahora,
            )
            .order_by(Acta.fecha_devolucion_prevista)
        ).all()

        if not actas:
            log.info("Alerta vencidas: no hay actas vencidas hoy.")
            return

        filas = ""
        for a in actas:
            snap = a.snapshot or {}
            pac = snap.get("paciente", {})
            eq = snap.get("equipo", {})
            prevista = a.fecha_devolucion_prevista
            prevista_str = prevista.astimezone(COLOMBIA).strftime("%d/%m/%Y %H:%M") if prevista else "—"
            telefono = pac.get("telefono") or snap.get("telefono") or "—"
            filas += (
                f"<tr>"
                f"<td style='padding:6px 10px;border-bottom:1px solid #e2e8f0'>#{a.numero}</td>"
                f"<td style='padding:6px 10px;border-bottom:1px solid #e2e8f0'>{pac.get('nombre_completo','—')}</td>"
                f"<td style='padding:6px 10px;border-bottom:1px solid #e2e8f0'>{telefono}</td>"
                f"<td style='padding:6px 10px;border-bottom:1px solid #e2e8f0'>"
                f"{eq.get('tipo_nombre', eq.get('tipo',''))}</td>"
                f"<td style='padding:6px 10px;border-bottom:1px solid #e2e8f0'>{eq.get('serie','—')}</td>"
                f"<td style='padding:6px 10px;border-bottom:1px solid #e2e8f0;color:#dc2626'>{prevista_str}</td>"
                f"</tr>"
            )

        html = f"""
        <h2 style='color:#1e3a5f'>Equipos vencidos — IPS Nueva Popayán</h2>
        <p>Hay <b>{len(actas)} equipo(s)</b> cuya fecha de devolución ya pasó y aún no han sido devueltos.</p>
        <table style='border-collapse:collapse;width:100%;font-size:13px'>
          <thead>
            <tr style='background:#1e3a5f;color:white'>
              <th style='padding:8px 10px;text-align:left'>Acta</th>
              <th style='padding:8px 10px;text-align:left'>Paciente</th>
              <th style='padding:8px 10px;text-align:left'>Teléfono</th>
              <th style='padding:8px 10px;text-align:left'>Equipo</th>
              <th style='padding:8px 10px;text-align:left'>Serie</th>
              <th style='padding:8px 10px;text-align:left'>Debía devolver</th>
            </tr>
          </thead>
          <tbody>{filas}</tbody>
        </table>
        <p style='color:#64748b;font-size:12px;margin-top:16px'>
          Generado automáticamente por el sistema de actas — {ahora.astimezone(COLOMBIA).strftime("%d/%m/%Y %H:%M")}
        </p>
        """

        asunto = f"⚠ {len(actas)} equipo(s) vencido(s) — IPS Nueva Popayán"
        for correo in settings.alertas_lista:
            try:
                enviar_correo(destinatario=correo, asunto=asunto, html=html)
                log.info("Alerta vencidas enviada a %s", correo)
            except Exception as exc:  # noqa: BLE001
                log.warning("No se pudo enviar alerta a %s: %s", correo, exc)

    except Exception as exc:  # noqa: BLE001
        log.error("Error en tarea_alertas_vencidas: %s", exc)
    finally:
        db.close()
