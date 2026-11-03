import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class PacienteBase(BaseModel):
    tipo_documento: str = Field(default="CC", max_length=10)
    numero_documento: str = Field(min_length=3, max_length=30)
    nombre_completo: str = Field(min_length=3, max_length=200)
    ciudad_expedicion: str | None = Field(default=None, max_length=100)
    vecino_de: str | None = Field(default=None, max_length=150)
    correo: EmailStr | None = None
    telefono: str | None = Field(default=None, max_length=30)

    @field_validator("numero_documento", "nombre_completo")
    @classmethod
    def limpiar(cls, v: str) -> str:
        return v.strip()


class PacienteCreate(PacienteBase):
    pass


class PacienteUpdate(PacienteBase):
    pass


class PacienteOut(PacienteBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


class HistorialPacienteItem(BaseModel):
    acta_id: uuid.UUID
    numero: int
    estado: str
    equipo: str
    fecha_entrega: datetime
    fecha_devolucion_prevista: datetime | None
    fecha_devolucion_real: datetime | None


class PacienteResumen(PacienteOut):
    total_prestamos: int = 0
    ultimo_prestamo: datetime | None = None
    en_prestamo: bool = False


class PacientesPagina(BaseModel):
    total: int
    items: list[PacienteResumen]
