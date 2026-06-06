"""User account model."""

import uuid
from uuid import UUID

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(80))

    # Gamification
    coins: Mapped[int] = mapped_column(default=0)
    level: Mapped[int] = mapped_column(default=1)

    # Chosen character + cosmetics (e.g. {"species": "fox", "color": "amber"})
    character_config: Mapped[dict] = mapped_column(
        JSONB, default=dict, server_default="{}"
    )
