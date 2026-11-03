"""foto del equipo

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-10 12:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('equipos', sa.Column('foto_path', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('equipos', 'foto_path')
