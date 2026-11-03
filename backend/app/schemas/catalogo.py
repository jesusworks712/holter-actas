from pydantic import BaseModel, ConfigDict, Field


class CatalogoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str


class CatalogoCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)