import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.core.security import hash_password
from app.models import Auditoria, Usuario
from app.schemas.usuario import PasswordTemporal, UsuarioAdminOut, UsuarioCreate, UsuarioUpdate

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


def _get_or_404(db: Session, usuario_id: uuid.UUID) -> Usuario:
    u = db.get(Usuario, usuario_id)
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    return u


def _admins_activos(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(Usuario).where(Usuario.rol == "ADMIN", Usuario.activo.is_(True)))


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.get("", response_model=list[UsuarioAdminOut])
def listar(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.scalars(select(Usuario).order_by(Usuario.activo.desc(), Usuario.nombre)).all()


@router.post("", response_model=UsuarioAdminOut, status_code=201)
def crear(data: UsuarioCreate, request: Request, db: Session = Depends(get_db), admin: Usuario = Depends(require_admin)):
    usuario = Usuario(
        username=data.username, nombre=data.nombre, email=str(data.email) if data.email else None,
        rol=data.rol, password_hash=hash_password(data.password),
        debe_cambiar_password=True,  # el usuario elige su propia contraseña al entrar
    )
    db.add(usuario)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un usuario con ese nombre de usuario")
    db.add(Auditoria(usuario_id=admin.id, accion="CREAR_USUARIO", entidad="usuario", entidad_id=str(usuario.id),
                     detalle={"username": usuario.username, "rol": usuario.rol}, ip=_ip(request)))
    db.commit()
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioAdminOut)
def actualizar(usuario_id: uuid.UUID, data: UsuarioUpdate, request: Request, db: Session = Depends(get_db),
               admin: Usuario = Depends(require_admin)):
    usuario = _get_or_404(db, usuario_id)

    if usuario.id == admin.id and (not data.activo or data.rol != "ADMIN"):
        raise HTTPException(status.HTTP_409_CONFLICT, "No puedes desactivarte ni quitarte el rol de administrador a ti mismo")
    deja_de_ser_admin_activo = usuario.rol == "ADMIN" and usuario.activo and (data.rol != "ADMIN" or not data.activo)
    if deja_de_ser_admin_activo and _admins_activos(db) <= 1:
        raise HTTPException(status.HTTP_409_CONFLICT, "Debe quedar al menos un administrador activo")

    cambios = {}
    for campo, nuevo in (("nombre", data.nombre), ("email", str(data.email) if data.email else None),
                         ("rol", data.rol), ("activo", data.activo)):
        if getattr(usuario, campo) != nuevo:
            cambios[campo] = [getattr(usuario, campo), nuevo]
            setattr(usuario, campo, nuevo)
    if data.activo:
        usuario.bloqueado_hasta = None
        usuario.intentos_fallidos = 0
    db.add(Auditoria(usuario_id=admin.id, accion="EDITAR_USUARIO", entidad="usuario", entidad_id=str(usuario.id),
                     detalle={"username": usuario.username, "cambios": cambios}, ip=_ip(request)))
    db.commit()
    return usuario


@router.post("/{usuario_id}/reset-password", response_model=PasswordTemporal)
def resetear_password(usuario_id: uuid.UUID, request: Request, db: Session = Depends(get_db),
                      admin: Usuario = Depends(require_admin)):
    usuario = _get_or_404(db, usuario_id)
    temporal = secrets.token_urlsafe(9)  # ~12 caracteres; se muestra una sola vez
    usuario.password_hash = hash_password(temporal)
    usuario.debe_cambiar_password = True
    usuario.bloqueado_hasta = None
    usuario.intentos_fallidos = 0
    db.add(Auditoria(usuario_id=admin.id, accion="RESET_PASSWORD", entidad="usuario", entidad_id=str(usuario.id),
                     detalle={"username": usuario.username}, ip=_ip(request)))
    db.commit()
    return PasswordTemporal(password_temporal=temporal)
