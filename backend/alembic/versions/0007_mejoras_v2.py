"""Mejoras v2: índice en actas(paciente_id, estado) para búsqueda de préstamos activos.

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-26
"""

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Índice compuesto para la validación "paciente ya tiene préstamo activo"
    # que se ejecuta en cada creación de acta.
    op.create_index(
        "ix_actas_paciente_estado",
        "actas",
        ["paciente_id", "estado"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_actas_paciente_estado", table_name="actas")
