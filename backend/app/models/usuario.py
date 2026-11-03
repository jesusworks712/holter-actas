from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, LargeBinary, String, false, true
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class Usuario(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "usuarios"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150))
    email: Mapped[str | None] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    rol: Mapped[str] = mapped_column(String(20), default="OPERADOR", server_default="OPERADOR")
    activo: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    debe_cambiar_password: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    intentos_fallidos: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    bloqueado_hasta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ultimo_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Firma guardada en el perfil (se carga sola al crear un acta). deferred: la imagen solo se lee cuando hace falta.
    firma_png: Mapped[bytes | None] = mapped_column(LargeBinary, deferred=True)
    firma_actualizada_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    documento: Mapped[str | None] = mapped_column(String(30))  # cédula; sale bajo la firma en el acta

    @property
    def tiene_firma(self) -> bool:
        return self.firma_actualizada_en is not None
