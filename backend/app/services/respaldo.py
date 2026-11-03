"""Copias de seguridad: base de datos + PDFs + fotos, en un solo .zip dentro de storage/backups."""
import base64
import json
import re
import shutil
import subprocess
import zipfile
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from sqlalchemy.engine import make_url

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

COLOMBIA = timezone(timedelta(hours=-5))
PATRON = re.compile(r"^respaldo-\d{8}-\d{6}\.zip$")

LEEME = """COPIA DE SEGURIDAD - Actas de préstamo (IPS Nueva Popayán)
Generada: {fecha}
Base de datos: {metodo}

CONTENIDO
- {archivo_bd}: la base de datos.
- archivos/pdfs: las actas en PDF.
- archivos/equipos: las fotos de los equipos.

CÓMO RESTAURAR (con el sistema apagado)
1. Copia las carpetas archivos/pdfs y archivos/equipos dentro de la carpeta storage del proyecto (pdfs y equipos).
2. Base de datos en formato .sql (pg_dump):
   docker exec -i {contenedor} psql -U {usuario} -d {base} < base_de_datos.sql
   (antes, en una base vacía: ejecuta "python -m alembic upgrade head" no es necesario; el .sql ya trae las tablas).
3. Si la copia trae base_de_datos.json (respaldo portable), pide ayuda para importarla: contiene todas las tablas en JSON.
"""


def _json_default(o):
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    if isinstance(o, UUID):
        return str(o)
    if isinstance(o, Decimal):
        return float(o)
    if isinstance(o, (bytes, bytearray, memoryview)):
        return {"__base64__": base64.b64encode(bytes(o)).decode("ascii")}
    raise TypeError(type(o))


def _volcado_pg_dump() -> tuple[bytes, str] | None:
    url = make_url(settings.DATABASE_URL)
    if url.get_backend_name() != "postgresql":
        return None
    base = ["-U", url.username or "postgres", "-d", url.database or "", "--no-owner"]
    intentos = []
    if shutil.which("pg_dump"):
        intentos.append((["pg_dump", "-h", url.host or "localhost", "-p", str(url.port or 5432), *base],
                         {"PGPASSWORD": url.password or ""}, "pg_dump"))
    if shutil.which("docker"):
        intentos.append((["docker", "exec", "-e", f"PGPASSWORD={url.password or ''}", settings.DB_CONTAINER, "pg_dump", *base],
                         {}, "docker"))
    import os
    for cmd, env, nombre in intentos:
        try:
            r = subprocess.run(cmd, capture_output=True, timeout=600, env={**os.environ, **env})
        except (OSError, subprocess.TimeoutExpired):
            continue
        if r.returncode == 0 and r.stdout:
            return r.stdout, nombre
    return None


def _volcado_json() -> bytes:
    datos = {}
    with engine.connect() as conn:
        for tabla in Base.metadata.sorted_tables:
            datos[tabla.name] = [dict(f._mapping) for f in conn.execute(tabla.select())]
    return json.dumps(datos, default=_json_default, ensure_ascii=False, indent=1).encode("utf-8")


def crear_respaldo() -> dict:
    settings.backup_dir.mkdir(parents=True, exist_ok=True)
    ahora = datetime.now(COLOMBIA)
    nombre = f"respaldo-{ahora:%Y%m%d-%H%M%S}.zip"
    destino = settings.backup_dir / nombre

    pg = _volcado_pg_dump()
    if pg:
        contenido, metodo, archivo_bd = pg[0], pg[1], "base_de_datos.sql"
    else:
        contenido, metodo, archivo_bd = _volcado_json(), "json", "base_de_datos.json"

    url = make_url(settings.DATABASE_URL)
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(archivo_bd, contenido)
        z.writestr("LEEME.txt", LEEME.format(fecha=ahora.strftime("%d/%m/%Y %H:%M"), metodo=metodo, archivo_bd=archivo_bd,
                                             contenedor=settings.DB_CONTAINER, usuario=url.username, base=url.database))
        for carpeta, etiqueta in ((settings.pdf_dir, "pdfs"), (settings.fotos_dir, "equipos")):
            if carpeta.exists():
                for f in carpeta.iterdir():
                    if f.is_file() and f.name != ".gitkeep":
                        z.write(f, f"archivos/{etiqueta}/{f.name}")
    _limpiar_antiguos()
    return _info(destino) | {"metodo": metodo}


def _limpiar_antiguos() -> None:
    copias = sorted(p for p in settings.backup_dir.glob("respaldo-*.zip") if PATRON.match(p.name))
    for viejo in copias[: max(0, len(copias) - settings.BACKUP_CONSERVAR)]:
        viejo.unlink(missing_ok=True)


def _info(p: Path) -> dict:
    return {"nombre": p.name, "tamano": p.stat().st_size,
            "fecha": datetime.fromtimestamp(p.stat().st_mtime, COLOMBIA).isoformat()}


def listar_respaldos() -> list[dict]:
    if not settings.backup_dir.exists():
        return []
    return [_info(p) for p in sorted(settings.backup_dir.glob("respaldo-*.zip"), reverse=True) if PATRON.match(p.name)]


def ruta_respaldo(nombre: str) -> Path | None:
    if not PATRON.match(nombre):
        return None
    p = settings.backup_dir / nombre
    return p if p.exists() else None


def respaldo_diario() -> bool:
    """Hace una copia por día, a partir de la hora configurada."""
    ahora = datetime.now(COLOMBIA)
    if ahora.hour < settings.BACKUP_HORA:
        return False
    if any(c["nombre"].startswith(f"respaldo-{ahora:%Y%m%d}") for c in listar_respaldos()):
        return False
    crear_respaldo()
    return True
