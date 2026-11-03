from datetime import datetime

from sqlalchemy import DateTime, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class Paciente(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "pacientes"
    __table_args__ = (UniqueConstraint("tipo_documento", "numero_documento", name="uq_pacientes_documento"),)

    tipo_documento: Mapped[str] = mapped_column(String(10), default="CC", server_default="CC")
    numero_documento: Mapped[str] = mapped_column(String(30), index=True)
    nombre_completo: Mapped[str] = mapped_column(String(200))
    ciudad_expedicion: Mapped[str | None] = mapped_column(String(100))
    vecino_de: Mapped[str | None] = mapped_column(String(150))
    correo: Mapped[str | None] = mapped_column(String(255))
    telefono: Mapped[str | None] = mapped_column(String(30))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # borrado lógico
