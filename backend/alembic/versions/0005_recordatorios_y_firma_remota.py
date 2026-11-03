"""recordatorio de devolución y enlaces de firma remota

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-10 15:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('actas', sa.Column('recordatorio_enviado_en', sa.DateTime(timezone=True), nullable=True))
    op.create_table(
        'enlaces_firma',
        sa.Column('acta_id', sa.Uuid(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expira_en', sa.DateTime(timezone=True), nullable=False),
        sa.Column('usado_en', sa.DateTime(timezone=True), nullable=True),
        sa.Column('creado_por', sa.Uuid(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['acta_id'], ['actas.id'], name=op.f('fk_enlaces_firma_acta_id_actas'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['creado_por'], ['usuarios.id'], name=op.f('fk_enlaces_firma_creado_por_usuarios')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_enlaces_firma')),
        sa.UniqueConstraint('token_hash', name=op.f('uq_enlaces_firma_token_hash')),
    )
    op.create_index(op.f('ix_enlaces_firma_acta_id'), 'enlaces_firma', ['acta_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_enlaces_firma_acta_id'), table_name='enlaces_firma')
    op.drop_table('enlaces_firma')
    op.drop_column('actas', 'recordatorio_enviado_en')
