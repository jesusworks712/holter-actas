"""Datos iniciales: usuario general + catálogos. Se puede correr varias veces (no duplica).

Uso:  python -m scripts.seed
"""
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Aseguradora, Regimen, TipoEquipo, Usuario

TIPOS_EQUIPO = [
    ("HOLTER", "Holter", "EVO"),
    ("MAPA", "MAPA", "Spacelabs"),
]
REGIMENES = ["Contributivo", "Subsidiado", "Especial", "Particular"]
ASEGURADORAS: list[str] = []  # agrega aquí las EPS con las que trabajan


def get_or_create(db, model, field, value, **extra):
    obj = db.scalar(select(model).where(getattr(model, field) == value))
    if not obj:
        db.add(model(**{field: value}, **extra))
    return obj


def main():
    with SessionLocal() as db:
        if not db.scalar(select(Usuario).where(Usuario.username == settings.ADMIN_USERNAME)):
            db.add(Usuario(username=settings.ADMIN_USERNAME, nombre=settings.ADMIN_NOMBRE,
                           password_hash=hash_password(settings.ADMIN_PASSWORD),
                           rol="ADMIN",
                           debe_cambiar_password=True))
            print(f"Usuario creado: {settings.ADMIN_USERNAME}")
        for codigo, nombre, marca in TIPOS_EQUIPO:
            get_or_create(db, TipoEquipo, "codigo", codigo, nombre=nombre, marca=marca)
        for r in REGIMENES:
            get_or_create(db, Regimen, "nombre", r)
        for a in ASEGURADORAS:
            get_or_create(db, Aseguradora, "nombre", a)
        db.commit()
    print("Seed listo.")


if __name__ == "__main__":
    main()