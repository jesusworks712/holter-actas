import uuid

from pydantic import BaseModel, ConfigDict, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    username: str
    nombre: str
    email: str | None = None
    rol: str
    debe_cambiar_password: bool = False
    documento: str | None = None
    tiene_firma: bool = False


class CambiarPassword(BaseModel):
    password_actual: str
    password_nueva: str = Field(min_length=8)