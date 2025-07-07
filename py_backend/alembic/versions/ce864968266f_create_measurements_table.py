"""create measurements table

Revision ID: ce864968266f
Revises: 
Create Date: 2025-07-01 03:33:38.144989

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ce864968266f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# operations to apply when migrating forward
def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'measurements',
        sa.Column('id', sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('measured_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('sensor_type', sa.Text, nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('metrics', sa.JSON(), nullable=True),
    )

# inverse operations to revert changes when migrating backward
def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('measurements')
