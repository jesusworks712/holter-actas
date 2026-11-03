"""
Programador de tareas periódicas (APScheduler).
Se llama una sola vez desde main.py en el lifespan de FastAPI.
"""

import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings

log = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def iniciar() -> None:
    global _scheduler  # noqa: PLW0603

    if not settings.SCHEDULER_ACTIVO:
        log.info("Scheduler desactivado (SCHEDULER_ACTIVO=false).")
        return

    # Importar aquí para no crear ciclos de importación al arrancar
    from app.services.recordatorios import tarea_recordatorios, tarea_alertas_vencidas
    from app.services.respaldo import respaldo_diario as hacer_backup

    _scheduler = BackgroundScheduler(timezone="America/Bogota")

    # Recordatorios al paciente: cada 30 minutos
    _scheduler.add_job(
        tarea_recordatorios,
        IntervalTrigger(minutes=30),
        id="recordatorios",
        replace_existing=True,
        misfire_grace_time=120,
    )

    # Alerta de vencidas al personal: todos los días a las 8 a.m. (Colombia)
    _scheduler.add_job(
        tarea_alertas_vencidas,
        CronTrigger(hour=8, minute=0),
        id="alertas_vencidas",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Copia de seguridad: a la hora configurada en BACKUP_HORA (por defecto 2 a.m.)
    _scheduler.add_job(
        hacer_backup,
        CronTrigger(hour=settings.BACKUP_HORA, minute=0),
        id="backup_diario",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    _scheduler.start()
    log.info(
        "Scheduler iniciado: recordatorios cada 30 min, alertas a las 08:00, backup a las %02d:00.",
        settings.BACKUP_HORA,
    )


def detener() -> None:
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        log.info("Scheduler detenido.")