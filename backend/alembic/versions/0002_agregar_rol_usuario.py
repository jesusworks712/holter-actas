"""agregar rol a usuarios

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-08 09:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'usuarios',
        sa.Column('rol', sa.String(length=20), server_default='OPERADOR', nullable=False),
    )
    # Los usuarios que ya existen (solo el general) pasan a ser ADMIN
    op.execute("UPDATE usuarios SET rol = 'ADMIN'")


def downgrade() -> None:
    op.drop_column('usuarios', 'rol')