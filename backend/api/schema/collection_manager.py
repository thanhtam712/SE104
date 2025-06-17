\
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# --- Collection Schemas ---
class CollectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the collection")

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="New name for the collection")
    is_active: Optional[bool] = Field(None, description="Set collection active or inactive")

class FileInfoSimple(BaseModel): # Basic file info for collection response
    id: uuid.UUID
    name: str
    type: str
    size: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class CollectionResponse(CollectionBase):
    id: uuid.UUID
    is_active: bool = Field(default=True) # Provide a default
    created_at: datetime
    updated_at: datetime
    files: List[FileInfoSimple] = []

    class Config:
        from_attributes = True

class CollectionListResponse(BaseModel):
    collections: List[CollectionResponse]

class CollectionStatsResponse(BaseModel):
    collection_id: uuid.UUID
    collection_name: str
    total_files: int
    files_by_type: dict[str, int]

    class Config:
        from_attributes = True

# Corrected QdrantCollectionStatusResponse
class QdrantCollectionStatusResponse(CollectionResponse):
    num_qdrant_points: int
    num_distinct_documents_in_qdrant: int
    qdrant_collection_name: str

    class Config:
        from_attributes = True


# --- File Schemas ---
class FileBase(BaseModel):
    name: str
    type: str
    size: int

class FileResponse(FileBase):
    id: uuid.UUID
    collection_id: uuid.UUID
    uploaded_at: datetime

    class Config:
        from_attributes = True

class FileListResponse(BaseModel):
    files: List[FileResponse]

class FileUploadResponse(FileResponse):
    parsed_content_preview: Optional[str] = None


# --- Chunk Schemas ---
class ChunkResponse(BaseModel):
    id: str # Qdrant point ID
    text: str
    file_id: uuid.UUID
    file_name: str
    chunk_sequence: int
    # Add other relevant chunk metadata if available

    class Config:
        from_attributes = True

class ChunkListResponse(BaseModel):
    chunks: List[ChunkResponse]


__all__ = [
    "CollectionBase",
    "CollectionCreate",
    "CollectionUpdate",
    "FileInfoSimple",
    "CollectionResponse",
    "CollectionListResponse",
    "CollectionStatsResponse",
    "QdrantCollectionStatusResponse",
    "FileBase",
    "FileResponse",
    "FileListResponse",
    "FileUploadResponse",
    "ChunkResponse", # Added
    "ChunkListResponse", # Added
]
