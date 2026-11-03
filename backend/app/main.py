from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.routes import (
    actas, auditoria, auth, catalogos, dashboard, documentos, equipos, firma_remota, firmas, pacientes,
    perfil, reportes, respaldos, usuarios,
)
from app.core.config import settings
from app.services import programador

@asynccontextmanager
async def lifespan(_: FastAPI):
    programador.iniciar()  # recordatorios, alerta de vencidas y copia diaria
    yield


app = FastAPI(title="Actas de Préstamo Holter - IPS Nueva Popayán", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(pacientes.router, prefix="/api")
app.include_router(equipos.router, prefix="/api")
app.include_router(catalogos.router, prefix="/api")
app.include_router(actas.router, prefix="/api")
app.include_router(firmas.router, prefix="/api")
app.include_router(documentos.router, prefix="/api")
app.include_router(usuarios.router, prefix="/api")
app.include_router(auditoria.router, prefix="/api")
app.include_router(reportes.router, prefix="/api")
app.include_router(respaldos.router, prefix="/api")
app.include_router(perfil.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(firma_remota.router, prefix="/api")


@app.get("/api/health", tags=["sistema"])
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}