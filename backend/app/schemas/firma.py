from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class FirmaCreate(BaseModel):
    rol: Literal["PACIENTE", "ENFERMERA"]
    firmante_nombre: str | None = Field(default=None, max_length=200)
    firmante_documento: str | None = Field(default=None, max_length=30)
    # Imagen PNG en base64 (acepta también el formato "data:image/png;base64,...")
    imagen: str | None = Field(default=None, min_length=20)

    # El paciente no puede firmar (discapacidad, menor de edad, etc.)
    no_puede_firmar: bool = False
    motivo_no_firma: str | None = Field(default=None, max_length=500)
    # Quien lo acompaña o firma a su ruego (opcional)
    responsable_nombre: str | None = Field(default=None, max_length=200)
    responsable_documento: str | None = Field(default=None, max_length=30)

    @field_validator("motivo_no_firma", "responsable_nombre", "responsable_documento")
    @classmethod
    def limpiar(cls, v: str | None) -> str | None:
        v = (v or "").strip()
        return v or None

    @model_validator(mode="after")
    def coherente(self):
        if self.no_puede_firmar:
            if self.rol != "PACIENTE":
                raise ValueError("Solo el paciente puede registrarse como «no puede firmar»")
            if not self.motivo_no_firma or len(self.motivo_no_firma) < 5:
                raise ValueError("Escribe el motivo por el cual el paciente no puede firmar")
        elif not self.imagen:
            raise ValueError("Falta la imagen de la firma")
        return self


class FirmaResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    rol: str
    firmante_nombre: str | None
    firmante_documento: str | None
    firmado_en: datetime
    motivo_no_firma: str | None = None
    responsable_nombre: str | None = None
    responsable_documento: str | None = None


class FirmasEstado(BaseModel):
    estado: str
    roles_firmados: list[str]
    completa: bool
