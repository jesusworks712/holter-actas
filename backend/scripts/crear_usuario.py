import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Usuario


def main():
    username = input("Usuario: ").strip()
    if not username:
        print("El usuario es obligatorio. No se creó nada.")
        return
    nombre = input("Nombre completo: ").strip() or username
    rol = input("Rol (ADMIN u OPERADOR) [OPERADOR]: ").strip().upper() or "OPERADOR"
    if rol not in ("ADMIN", "OPERADOR"):
        print("Rol no válido. Usa ADMIN u OPERADOR. No se creó nada.")
        return

    p1 = getpass.getpass("Contraseña: ")
    p2 = getpass.getpass("Repite la contraseña: ")
    if p1 != p2:
        print("Las contraseñas no coinciden. No se creó nada.")
        return
    if len(p1) < 8:
        print("Debe tener al menos 8 caracteres. No se creó nada.")
        return

    with SessionLocal() as db:
        if db.scalar(select(Usuario).where(Usuario.username == username)):
            print(f"Ya existe el usuario '{username}'. No se creó nada.")
            return
        db.add(Usuario(
            username=username,
            nombre=nombre,
            password_hash=hash_password(p1),
            rol=rol,
            debe_cambiar_password=False,
        ))
        db.commit()
        print(f"Listo: usuario '{username}' creado con rol {rol}.")


if __name__ == "__main__":
    main()