import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import Usuario


def main():
    username = input("Usuario [admin]: ").strip() or "admin"
    p1 = getpass.getpass("Nueva contraseña: ")
    p2 = getpass.getpass("Repite la contraseña: ")

    if p1 != p2:
        print("Las contraseñas no coinciden. No se cambió nada.")
        return
    if len(p1) < 8:
        print("Debe tener al menos 8 caracteres. No se cambió nada.")
        return

    with SessionLocal() as db:
        user = db.scalar(select(Usuario).where(Usuario.username == username))
        if not user:
            print(f"No existe el usuario '{username}'. No se cambió nada.")
            return
        user.password_hash = hash_password(p1)
        user.activo = True
        user.debe_cambiar_password = False
        db.commit()
        print(f"Listo: contraseña de '{username}' actualizada.")


if __name__ == "__main__":
    main()