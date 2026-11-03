import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.equipo import EquipoOut
from app.schemas.paciente import PacienteOut

COLOMBIA = timezone(timedelta(hours=-5))


class ActaCreate(BaseModel):
    paciente_id: uuid.UUID
    equipo_id: uuid.UUID
    aseguradora_id: int | None = None
    regimen_id: int | None = None
    fecha_entrega: datetime
    duracion_horas: Literal[24, 48] = 24
    observaciones: str | None = None

    @field_validator("fecha_entrega")
    @classmethod
    def con_zona_horaria(cls, v: datetime) -> datetime:
        return v if v.tzinfo else v.replace(tzinfo=COLOMBIA)


class ActaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    numero: int
    estado: str
    formato_codigo: str
    formato_version: str
    fecha_entrega: datetime
    fecha_devolucion_prevista: datetime | None
    fecha_devolucion_real: datetime | None
    duracion_horas: int
    aseguradora_id: int | None
    regimen_id: int | None
    observaciones: str | None
    snapshot: dict | None
    paciente: PacienteOut
    equipo: EquipoOut


class ActaDevolver(BaseModel):
    estado_equipo: Literal["DISPONIBLE", "MANTENIMIENTO"] = "DISPONIBLE"
    observaciones: str | None = None


class ActaCorregir(BaseModel):
    """Corrección de errores de digitación antes de enviar el acta.
    
    IMPORTANTE: solo modifica el snapshot del acta, no el registro del Paciente
    en la base de datos. Así las demás actas del paciente no se ven afectadas.
    """

    tipo_documento: str = Field(default="CC", max_length=10)
    numero_documento: str = Field(min_length=3, max_length=30)
    nombre_completo: str = Field(min_length=3, max_length=200)
    ciudad_expedicion: str | None = Field(default=None, max_length=100)
    vecino_de: str | None = Field(default=None, max_length=150)
    correo: EmailStr | None = None
    telefono: str | None = Field(default=None, max_length=30)   # ← nuevo
    aseguradora_id: int | None = None
    regimen_id: int | None = None
    fecha_entrega: datetime
    duracion_horas: Literal[24, 48] = 24
    observaciones: str | None = Field(default=None, max_length=2000)

    @field_validator("numero_documento", "nombre_completo")
    @classmethod
    def limpiar(cls, v: str) -> str:
        return v.strip()

    @field_validator("fecha_entrega")
    @classmethod
    def con_zona_horaria(cls, v: datetime) -> datetime:
        return v if v.tzinfo else v.replace(tzinfo=COLOMBIA)


class ActaAnular(BaseModel):
    motivo: str = Field(min_length=5, max_length=500)

    @field_validator("motivo")
    @classmethod
    def limpiar(cls, v: str) -> str:
        return v.strip()
