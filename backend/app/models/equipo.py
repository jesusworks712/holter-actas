from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String, Text, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class TipoEquipo(Base):
    """Catálogo: HOLTER, MAPA... (agregar un equipo nuevo = insertar una fila, sin tocar código)."""

    __tablename__ = "tipos_equipo"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(30), unique=True)
    nombre: Mapped[str] = mapped_column(String(100))
    marca: Mapped[str | None] = mapped_column(String(100))
    activo: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())


class Equipo(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "equipos"
    __table_args__ = (
        CheckConstraint(
            "estado IN ('DISPONIBLE','PRESTADO','MANTENIMIENTO','BAJA')", name="estado_valido"
        ),
    )

    tipo_equipo_id: Mapped[int] = mapped_column(ForeignKey("tipos_equipo.id"), index=True)
    serie: Mapped[str] = mapped_column(String(80), unique=True)
    marca: Mapped[str | None] = mapped_column(String(100))
    modelo: Mapped[str | None] = mapped_column(String(100))
    estado: Mapped[str] = mapped_column(String(20), default="DISPONIBLE", server_default="DISPONIBLE")
    notas: Mapped[str | None] = mapped_column(Text)
    foto_path: Mapped[str | None] = mapped_column(String(255))

    tipo: Mapped[TipoEquipo] = relationship()

    @property
    def tiene_foto(self) -> bool:
        return bool(self.foto_path)
