from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import Auditoria, Usuario
from app.schemas.auth import CambiarPassword, Token, UsuarioOut

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_INTENTOS = 5
MINUTOS_BLOQUEO = 15


@router.post("/login", response_model=Token)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    ahora = datetime.now(timezone.utc)
    user = db.scalar(select(Usuario).where(Usuario.username == form.username))

    # Si está bloqueado, no se prueba la contraseña
    if user and user.bloqueado_hasta and user.bloqueado_hasta > ahora:
        minutos = int((user.bloqueado_hasta - ahora).total_seconds() // 60) + 1
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Usuario bloqueado temporalmente. Intenta de nuevo en {minutos} minuto(s).",
        )

    if not user or not user.activo or not verify_password(form.password, user.password_hash):
        if user:
            user.intentos_fallidos += 1
            detalle = {"intentos": user.intentos_fallidos}
            if user.intentos_fallidos >= MAX_INTENTOS:
                user.bloqueado_hasta = ahora + timedelta(minutes=MINUTOS_BLOQUEO)
                user.intentos_fallidos = 0
                detalle["bloqueado"] = True
            db.add(Auditoria(usuario_id=user.id, accion="LOGIN_FALLIDO", detalle=detalle, ip=ip))
            db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos")

    user.intentos_fallidos = 0
    user.bloqueado_hasta = None
    user.ultimo_login = ahora
    db.add(Auditoria(usuario_id=user.id, accion="LOGIN", ip=ip))
    db.commit()
    return Token(access_token=create_access_token(user.username))


@router.get("/me", response_model=UsuarioOut)
def me(user: Usuario = Depends(get_current_user)):
    return user


@router.post("/cambiar-password", status_code=204)
def cambiar_password(data: CambiarPassword, user: Usuario = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    if not verify_password(data.password_actual, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual no es correcta")
    user.password_hash = hash_password(data.password_nueva)
    user.debe_cambiar_password = False
    db.add(Auditoria(usuario_id=user.id, accion="CAMBIAR_PASSWORD"))
    db.commit()