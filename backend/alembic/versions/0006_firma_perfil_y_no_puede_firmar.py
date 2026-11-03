"""firma guardada en el perfil y paciente que no puede firmar

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-12 09:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('firma_png', sa.LargeBinary(), nullable=True))
    op.add_column('usuarios', sa.Column('firma_actualizada_en', sa.DateTime(timezone=True), nullable=True))
    op.add_column('usuarios', sa.Column('documento', sa.String(length=30), nullable=True))
    op.alter_column('acta_firmas', 'imagen_png', existing_type=sa.LargeBinary(), nullable=True)
    op.add_column('acta_firmas', sa.Column('motivo_no_firma', sa.Text(), nullable=True))
    op.add_column('acta_firmas', sa.Column('responsable_nombre', sa.String(length=200), nullable=True))
    op.add_column('acta_firmas', sa.Column('responsable_documento', sa.String(length=30), nullable=True))


def downgrade() -> None:
    op.drop_column('acta_firmas', 'responsable_documento')
    op.drop_column('acta_firmas', 'responsable_nombre')
    op.drop_column('acta_firmas', 'motivo_no_firma')
    op.alter_column('acta_firmas', 'imagen_png', existing_type=sa.LargeBinary(), nullable=False)
    op.drop_column('usuarios', 'documento')
    op.drop_column('usuarios', 'firma_actualizada_en')
    op.drop_column('usuarios', 'firma_png')
