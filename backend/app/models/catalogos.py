from sqlalchemy import Boolean, Integer, String, true
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Aseguradora(Base):
    __tablename__ = "aseguradoras"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(150), unique=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())


class Regimen(Base):
    __tablename__ = "regimenes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(80), unique=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
