"""intentos fallidos y bloqueo de login

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-08 13:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'usuarios',
        sa.Column('intentos_fallidos', sa.Integer(), server_default='0', nullable=False),
    )
    op.add_column(
        'usuarios',
        sa.Column('bloqueado_hasta', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('usuarios', 'bloqueado_hasta')
    op.drop_column('usuarios', 'intentos_fallidos')