from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.models import Aseguradora, Regimen, Usuario
from app.schemas.catalogo import CatalogoCreate, CatalogoOut

router = APIRouter(prefix="/catalogos", tags=["catalogos"])


@router.get("/aseguradoras", response_model=list[CatalogoOut])
def listar_aseguradoras(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return db.scalars(select(Aseguradora).where(Aseguradora.activo.is_(True)).order_by(Aseguradora.nombre)).all()


@router.post("/aseguradoras", response_model=CatalogoOut, status_code=201)
def crear_aseguradora(data: CatalogoCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    obj = Aseguradora(nombre=data.nombre.strip())
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Esa aseguradora ya existe")
    return obj


@router.get("/regimenes", response_model=list[CatalogoOut])
def listar_regimenes(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)):
    return db.scalars(select(Regimen).where(Regimen.activo.is_(True)).order_by(Regimen.nombre)).all()