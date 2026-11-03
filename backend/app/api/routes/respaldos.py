from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models import Auditoria, Usuario
from app.services.respaldo import crear_respaldo, listar_respaldos, ruta_respaldo

router = APIRouter(prefix="/respaldos", tags=["respaldos"])


@router.get("")
def listar(_: Usuario = Depends(require_admin)):
    return listar_respaldos()


@router.post("", status_code=201)
def crear(request: Request, db: Session = Depends(get_db), admin: Usuario = Depends(require_admin)):
    info = crear_respaldo()
    db.add(Auditoria(usuario_id=admin.id, accion="CREAR_RESPALDO", detalle={"archivo": info["nombre"], "metodo": info["metodo"]},
                     ip=request.client.host if request.client else None))
    db.commit()
    return info


@router.get("/{nombre}")
def descargar(nombre: str, _: Usuario = Depends(require_admin)):
    ruta = ruta_respaldo(nombre)
    if not ruta:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Respaldo no encontrado")
    return FileResponse(ruta, media_type="application/zip", filename=nombre)
