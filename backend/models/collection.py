import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Boolean  # Added Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from bootstrap.db import Base


class Collection(Base):
    __tablename__ = "collections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)  # Names are now globally unique
    is_active = Column(Boolean, default=True, nullable=False)  # Added is_active attribute
    # user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False) # Removed
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # user = relationship("User", back_populates="collections") # Removed
    files = relationship("File", back_populates="collection", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Collection(id={self.id}, name='{self.name}')>"

# Add to User model in user.py: # This comment is now obsolete
# collections = relationship("Collection", back_populates="user", cascade="all, delete-orphan")
