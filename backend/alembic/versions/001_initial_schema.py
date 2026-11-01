"""Initial schema migration for ParkNexus

Revision ID: 001_initial
Revises: 
Create Date: 2026-11-01 22:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Tables are auto-created by SQLAlchemy Base.metadata.create_all,
    # and this migration serves as the baseline version tag.
    pass

def downgrade() -> None:
    pass
