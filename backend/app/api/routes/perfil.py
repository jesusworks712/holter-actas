"""Perfil de quien inicia sesión: su cédula y su firma guardada (se carga sola al crear actas)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import Auditoria, Usuario
from app.services.firma_imagen import normalizar_firma

router = APIRouter(prefix="/perfil", tags=["perfil"])


class FirmaIn(BaseModel):
    imagen: str = Field(min_length=20)


class DocumentoIn(BaseModel):
    documento: str = Field(min_length=3, max_length=30)

    @field_validator("documento")
    @classmethod
    def limpiar(cls, v: str) -> str:
        return v.strip()


def _ip(request: Request):
    return request.client.host if request.client else None


@router.get("")
def ver(user: Usuario = Depends(get_current_user)):
    return {"username": user.username, "nombre": user.nombre, "documento": user.documento, "tiene_firma": user.tiene_firma,
            "firma_actualizada_en": user.firma_actualizada_en}


@router.put("/documento")
def guardar_documento(data: DocumentoIn, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    user.documento = data.documento
    db.commit()
    return {"documento": user.documento}


@router.put("/firma")
def guardar_firma(data: FirmaIn, request: Request, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    user.firma_png = normalizar_firma(data.imagen)
    user.firma_actualizada_en = datetime.now(timezone.utc)
    db.add(Auditoria(usuario_id=user.id, accion="GUARDAR_FIRMA_PERFIL", ip=_ip(request)))
    db.commit()
    return {"tiene_firma": True}


@router.get("/firma.png")
def ver_firma(user: Usuario = Depends(get_current_user)):
    if not user.tiene_firma or not user.firma_png:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aún no has guardado tu firma")
    return Response(user.firma_png, media_type="image/png", headers={"Cache-Control": "no-store"})


@router.delete("/firma")
def quitar_firma(request: Request, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    user.firma_png = None
    user.firma_actualizada_en = None
    db.add(Auditoria(usuario_id=user.id, accion="QUITAR_FIRMA_PERFIL", ip=_ip(request)))
    db.commit()
    return {"tiene_firma": False}
