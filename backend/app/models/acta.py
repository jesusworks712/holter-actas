import uuid
from datetime import datetime

from sqlalchemy import (
    JSON, CheckConstraint, DateTime, ForeignKey, Identity, Integer, LargeBinary, String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Acta(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "actas"
    __table_args__ = (
        CheckConstraint("duracion_horas IN (24, 48)", name="duracion_valida"),
        CheckConstraint(
            "estado IN ('BORRADOR','FIRMADA','ENVIADA','DEVUELTA','ANULADA')", name="estado_valido"
        ),
    )

    numero: Mapped[int] = mapped_column(Integer, Identity(), unique=True)  # consecutivo legible
    # Versión del formato: si mañana sale FO-TGB-001 v02, las actas viejas conservan su versión.
    formato_codigo: Mapped[str] = mapped_column(String(30), default="FO-TGB-001", server_default="FO-TGB-001")
    formato_version: Mapped[str] = mapped_column(String(10), default="01", server_default="01")

    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pacientes.id"), index=True)
    equipo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("equipos.id"), index=True)
    creado_por: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"))
    aseguradora_id: Mapped[int | None] = mapped_column(ForeignKey("aseguradoras.id"))
    regimen_id: Mapped[int | None] = mapped_column(ForeignKey("regimenes.id"))

    fecha_entrega: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    fecha_devolucion_prevista: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fecha_devolucion_real: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duracion_horas: Mapped[int] = mapped_column(Integer, default=24)

    estado: Mapped[str] = mapped_column(String(20), default="BORRADOR", server_default="BORRADOR", index=True)
    observaciones: Mapped[str | None] = mapped_column(Text)

    # Copia de los datos tal como quedaron en el acta (el PDF histórico no cambia aunque edites al paciente).
    snapshot: Mapped[dict | None] = mapped_column(JSON)
    # Campos futuros sin migrar la tabla.
    datos_extra: Mapped[dict | None] = mapped_column(JSON)

    recordatorio_enviado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    pdf_path: Mapped[str | None] = mapped_column(String(500))
    pdf_sha256: Mapped[str | None] = mapped_column(String(64))

    paciente = relationship("Paciente")
    equipo = relationship("Equipo")
    firmas = relationship("ActaFirma", back_populates="acta", cascade="all, delete-orphan")
    envios = relationship("EnvioCorreo", back_populates="acta", cascade="all, delete-orphan")


class ActaFirma(UUIDMixin, Base):
    __tablename__ = "acta_firmas"
    __table_args__ = (CheckConstraint("rol IN ('PACIENTE','ENFERMERA')", name="rol_valido"),)

    acta_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("actas.id", ondelete="CASCADE"), index=True)
    rol: Mapped[str] = mapped_column(String(20))
    firmante_nombre: Mapped[str | None] = mapped_column(String(200))
    firmante_documento: Mapped[str | None] = mapped_column(String(30))
    imagen_png: Mapped[bytes | None] = mapped_column(LargeBinary)  # vacío si el paciente no puede firmar
    firmado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ip: Mapped[str | None] = mapped_column(String(45))
    # El paciente no puede firmar: se deja el motivo y, si lo hay, quién firma a su ruego.
    motivo_no_firma: Mapped[str | None] = mapped_column(Text)
    responsable_nombre: Mapped[str | None] = mapped_column(String(200))
    responsable_documento: Mapped[str | None] = mapped_column(String(30))

    acta = relationship("Acta", back_populates="firmas")


class EnvioCorreo(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "envios_correo"
    __table_args__ = (
        CheckConstraint("estado IN ('PENDIENTE','ENVIADO','ERROR')", name="estado_valido"),
    )

    acta_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("actas.id", ondelete="CASCADE"), index=True)
    destinatario: Mapped[str] = mapped_column(String(255))
    asunto: Mapped[str] = mapped_column(String(255))
    estado: Mapped[str] = mapped_column(String(15), default="PENDIENTE", server_default="PENDIENTE")
    proveedor: Mapped[str] = mapped_column(String(30), default="brevo", server_default="brevo")
    proveedor_message_id: Mapped[str | None] = mapped_column(String(200))
    intentos: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    error: Mapped[str | None] = mapped_column(Text)
    enviado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    acta = relationship("Acta", back_populates="envios")


class EnlaceFirma(UUIDMixin, TimestampMixin, Base):
    """Enlace de un solo uso para que el paciente firme desde su celular. Solo se guarda la huella del token."""

    __tablename__ = "enlaces_firma"

    acta_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("actas.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expira_en: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    usado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    creado_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"))
