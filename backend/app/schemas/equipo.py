import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Estado = Literal["DISPONIBLE", "PRESTADO", "MANTENIMIENTO", "BAJA"]


class TipoEquipoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    codigo: str
    nombre: str
    marca: str | None = None


class EquipoBase(BaseModel):
    tipo_equipo_id: int
    serie: str = Field(min_length=1, max_length=80)
    marca: str | None = Field(default=None, max_length=100)
    modelo: str | None = Field(default=None, max_length=100)
    notas: str | None = None


class EquipoCreate(EquipoBase):
    pass


class EquipoUpdate(EquipoBase):
    estado: Estado


class EquipoOut(EquipoBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    estado: Estado
    tiene_foto: bool = False
    tipo: TipoEquipoOut


class HistorialEquipoItem(BaseModel):
    acta_id: uuid.UUID
    numero: int
    estado: str
    paciente_nombre: str
    paciente_documento: str
    fecha_entrega: datetime
    fecha_devolucion_prevista: datetime | None
    fecha_devolucion_real: datetime | None
