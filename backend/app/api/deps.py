from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as db:
        yield db


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas",
                          headers={"WWW-Authenticate": "Bearer"})
    username = decode_access_token(token)
    if not username:
        raise error
    user = db.scalar(select(Usuario).where(Usuario.username == username))
    if not user or not user.activo:
        raise error
    return user


def require_admin(user: Usuario = Depends(get_current_user)) -> Usuario:
    """Solo deja pasar a usuarios con rol ADMIN."""
    if user.rol != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permisos para esta acción")
    return user