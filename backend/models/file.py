import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from bootstrap.db import Base


class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_id = Column(
        UUID(as_uuid=True), ForeignKey("collections.id"), nullable=False
    )
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # E.g., 'pdf', 'txt', 'docx'
    size = Column(Integer, nullable=False)  # Size in bytes
    content = Column(
        LargeBinary, nullable=True
    )  # Content of the file, stored as binary
    # For simplicity, storing content directly. For large files, consider storing a path or using a blob store.
    # content_preview = Column(Text, nullable=True) # Or store full content if appropriate
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    collection = relationship("Collection", back_populates="files")

    def __repr__(self):
        return f"<File(id={self.id}, name='{self.name}', collection_id={self.collection_id})>"
