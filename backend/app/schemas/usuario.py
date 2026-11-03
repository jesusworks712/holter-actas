import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Rol = Literal["ADMIN", "OPERADOR"]


class UsuarioAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    username: str
    nombre: str
    email: str | None = None
    rol: str
    activo: bool
    debe_cambiar_password: bool
    ultimo_login: datetime | None = None
    bloqueado_hasta: datetime | None = None


class UsuarioCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9._-]+$")
    nombre: str = Field(min_length=3, max_length=150)
    email: EmailStr | None = None
    rol: Rol = "OPERADOR"
    password: str = Field(min_length=8, max_length=100)

    @field_validator("username")
    @classmethod
    def minusculas(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("nombre")
    @classmethod
    def limpiar(cls, v: str) -> str:
        return v.strip()


class UsuarioUpdate(BaseModel):
    nombre: str = Field(min_length=3, max_length=150)
    email: EmailStr | None = None
    rol: Rol
    activo: bool

    @field_validator("nombre")
    @classmethod
    def limpiar(cls, v: str) -> str:
        return v.strip()


class PasswordTemporal(BaseModel):
    password_temporal: str


class AuditoriaOut(BaseModel):
    id: int
    fecha: datetime
    usuario: str | None
    username: str | None
    accion: str
    entidad: str | None
    entidad_id: str | None
    detalle: dict | None
    ip: str | None
