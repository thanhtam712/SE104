import uuid

# Removed tempfile and pathlib, will re-add if specific parsers need them
import os

import magic  # For MIME type detection
import openai  # Added
from qdrant_client import QdrantClient, models as qdrant_models  # Added
from qdrant_client.http.exceptions import (
    UnexpectedResponse,
)

from api.middleware.jwt_auth import get_current_user
from api.schema.collection_manager import (
    CollectionCreate,
    CollectionListResponse,
    CollectionResponse,
    CollectionStatsResponse,
    QdrantCollectionStatusResponse,  # Added
    CollectionUpdate,
    FileListResponse,  # Added
    FileResponse,
    FileUploadResponse,
    ChunkResponse,  # Added
    ChunkListResponse,  # Added
)
from bootstrap.db import get_db
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    status,
)
from fastapi import (
    File as FastAPIFile,
)
from fastapi.concurrency import run_in_threadpool
from internal.respond import respond_http
from internal.readers.thuann_reader import ThuaNNPdfReader  # Updated import
from models.collection import Collection
from models.file import (
    File as FileModel,
)
from models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from dotenv import load_dotenv

# Removed imports for RAG processing:
# from external.chatbot.src.embedding.rag import RAG
# from external.chatbot.src.settings import Settings as ExternalChatbotSettings

router = APIRouter()
load_dotenv()  # Load environment variables from .env file
openai.api_key = os.getenv("OPENAI_API_KEY")  # Set OpenAI API key from environment


# --- Helper Functions for Embedding ---


def chunk_text(
    text: str, chunk_size: int = 1000, chunk_overlap: int = 200
) -> list[str]:
    """Simple text chunking function."""
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = start + chunk_size
        chunks.append(text[start:end])
        if end >= text_len:
            break
        start += chunk_size - chunk_overlap
        # Ensure overlap doesn't push start beyond text_len if chunk_size is small
        if start >= text_len and text_len > chunk_size - chunk_overlap:
            # this case happens if the last chunk is smaller than overlap
            # and we don't want to create an empty chunk or re-process the tail.
            break  # Corrected indentation
    return chunks


async def get_openai_embedding(text: str, model="text-embedding-ada-002"):
    """Gets embedding from OpenAI for the given text."""
    # openai library automatically uses OPENAI_API_KEY from environment
    try:
        response = await openai.Embedding.acreate(input=[text], model=model)
        return response.data[0].embedding
    except openai.APIError as e:  # More specific OpenAI error
        print(f"OpenAI API error: {e}")
        raise
    except Exception as e:  # Catch other potential errors
        print(f"Error getting OpenAI embedding: {e}")
        raise


async def store_chunks_in_qdrant(
    qdrant_client: QdrantClient,
    qdrant_collection_name: str,
    file_id: uuid.UUID,
    file_name: str,
    chunks_data: list[str],  # Renamed from chunks to avoid collision
    embeddings: list[list[float]],
):
    """Stores chunks and their embeddings in Qdrant."""
    points = []
    for i, (text_chunk, embedding) in enumerate(
        zip(chunks_data, embeddings)
    ):  # Use renamed variable
        points.append(
            qdrant_models.PointStruct(
                id=str(uuid.uuid4()),
                payload={
                    "text": text_chunk,
                    "file_id": str(file_id),
                    "file_name": file_name,
                    "chunk_sequence": i,
                },
                vector=embedding,
            )
        )
    if points:
        await run_in_threadpool(
            qdrant_client.upsert, collection_name=qdrant_collection_name, points=points
        )
        print(
            f"Upserted {len(points)} points to Qdrant collection '{qdrant_collection_name}' for file '{file_name}'."
        )


# --- Helper function to get collection ---
async def get_collection_or_404(
    collection_id: uuid.UUID, db: AsyncSession
) -> Collection:  # Removed user_id
    stmt = (
        select(Collection)
        .where(Collection.id == collection_id)  # Removed user_id condition
        .options(selectinload(Collection.files))  # Eager load files
    )
    result = await db.execute(stmt)
    collection = result.scalars().first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found.",  # Simplified message
        )
    return collection


# --- Collection Endpoints ---


@router.post(
    "/", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED
)
async def create_collection(
    collection_data: CollectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Still require auth to create
):
    # Check if collection with the same name already exists globally
    stmt_existing = select(Collection).where(Collection.name == collection_data.name)
    result_existing = await db.execute(stmt_existing)
    if result_existing.scalars().first():
        return respond_http(
            status_code=status.HTTP_409_CONFLICT,
            status="error",
            message=f"Collection with name '{collection_data.name}' already exists.",
        )

    new_collection = Collection(**collection_data.model_dump())  # Removed user_id
    db.add(new_collection)
    await db.commit()
    await db.refresh(new_collection)
    # Manually construct the response to include the empty files list initially
    return CollectionResponse(
        id=new_collection.id,
        name=new_collection.name,
        # user_id=new_collection.user_id, # Removed
        created_at=new_collection.created_at,
        updated_at=new_collection.updated_at,
        files=[],  # Initialize with empty files list
    )


@router.get("/", response_model=CollectionListResponse, status_code=status.HTTP_200_OK)
async def list_collections(
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user), # No longer user-specific
):
    stmt = (
        select(Collection)
        # .where(Collection.user_id == current_user.id) # Removed user filter
        .options(selectinload(Collection.files))  # Eager load files for each collection
        .order_by(Collection.updated_at.desc())
    )
    result = await db.execute(stmt)
    collections = result.scalars().all()
    return CollectionListResponse(
        collections=[CollectionResponse.from_orm(c) for c in collections]
    )


@router.get(
    "/{collection_id}",
    response_model=CollectionResponse,
    status_code=status.HTTP_200_OK,
)
async def get_collection(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user), # No longer user-specific
):
    collection = await get_collection_or_404(collection_id, db)  # Removed user_id
    return CollectionResponse.from_orm(collection)


@router.get(
    "/{collection_id}/stats",
    response_model=CollectionStatsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_collection_stats(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user), # Optional: if stats are sensitive
):
    collection = await get_collection_or_404(collection_id, db)

    total_files = len(collection.files)
    files_by_type = {}
    for file_obj in collection.files:
        files_by_type[file_obj.type] = files_by_type.get(file_obj.type, 0) + 1

    return CollectionStatsResponse(
        collection_id=collection.id,
        collection_name=collection.name,
        total_files=total_files,
        files_by_type=files_by_type,
    )


@router.get(
    "/{collection_id}/qdrant-status",
    response_model=QdrantCollectionStatusResponse,
    status_code=status.HTTP_200_OK,
)
async def get_qdrant_collection_status(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user), # Optional: if status is sensitive
):
    collection = await get_collection_or_404(collection_id, db)
    qdrant_collection_name = f"collection_{str(collection_id).replace('-', '_')}"
    num_points = 0
    distinct_file_ids = set()

    try:
        qdrant_url = os.getenv("QDRANT_URL", "http://qdrant:6333")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key, timeout=10)

        try:
            collection_info = await run_in_threadpool(
                qdrant_client.get_collection, collection_name=qdrant_collection_name
            )
            num_points = collection_info.points_count if collection_info else 0

            if num_points > 0:
                # next_page_offset is available for pagination if needed in the future
                scroll_response, _next_page_offset = await run_in_threadpool(
                    qdrant_client.scroll,
                    collection_name=qdrant_collection_name,
                    limit=1000,
                    with_payload=["file_id"],
                    with_vectors=False,
                )
                for point in scroll_response:
                    if point.payload and "file_id" in point.payload:
                        distinct_file_ids.add(point.payload["file_id"])
                # To implement full pagination for distinct_file_ids,
                # use _next_page_offset in subsequent scroll calls.

        except UnexpectedResponse as e:
            # This specific Qdrant exception means collection not found or other API issue (e.g. 404)
            print(
                f"Qdrant collection '{qdrant_collection_name}' not found or API error: {e}"
            )
            # num_points and distinct_file_ids will remain 0, which is appropriate
        except (
            Exception
        ) as e:  # Catch any other unexpected errors during Qdrant interaction
            print(
                f"Unexpected error fetching Qdrant status for {qdrant_collection_name}: {e}"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error fetching Qdrant status: {str(e)}",
            ) from e

    except Exception as e:
        # This catches errors like Qdrant client initialization or other setup error
        print(f"Failed to initialize Qdrant client or other setup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error setting up Qdrant connection: {str(e)}",
        ) from e

    return QdrantCollectionStatusResponse(
        id=collection.id,
        name=collection.name,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        files=[FileResponse.from_orm(f) for f in collection.files],
        num_qdrant_points=num_points,
        num_distinct_documents_in_qdrant=len(distinct_file_ids),
        qdrant_collection_name=qdrant_collection_name,
    )


@router.put(
    "/{collection_id}",
    response_model=CollectionResponse,
    status_code=status.HTTP_200_OK,
)
async def update_collection(
    collection_id: uuid.UUID,
    collection_data: CollectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Still require auth to update
):
    collection = await get_collection_or_404(collection_id, db)  # Removed user_id

    update_fields = collection_data.model_dump(exclude_unset=True)

    if "name" in update_fields and update_fields["name"] != collection.name:
        # Check if the new name conflicts with another collection globally
        stmt_existing = select(Collection).where(
            Collection.name == update_fields["name"],
            Collection.id != collection_id,  # Exclude the current collection
        )
        result_existing = await db.execute(stmt_existing)
        if result_existing.scalars().first():
            return respond_http(
                status_code=status.HTTP_409_CONFLICT,
                status="error",
                message="Another collection with this name already exists.",
            )
        collection.name = update_fields["name"]

    if "is_active" in update_fields:
        collection.is_active = update_fields["is_active"]

    print("Updating collection with fields:", update_fields)
    print("Current collection state before update:", collection)

    await db.commit()
    await db.refresh(collection)
    return CollectionResponse.from_orm(collection)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # Still require auth to delete
):
    collection_model = await get_collection_or_404(
        collection_id, db
    )  # Renamed to avoid clash

    # --- Start Qdrant Collection Deletion ---
    try:
        qdrant_url = os.getenv("QDRANT_URL", "http://qdrant:6333")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key, timeout=10)
        qdrant_collection_name = f"collection_{str(collection_id).replace('-', '_')}"

        print(f"Attempting to delete Qdrant collection: {qdrant_collection_name}")
        await run_in_threadpool(
            qdrant_client.delete_collection, collection_name=qdrant_collection_name
        )
        print(
            f"Successfully deleted or confirmed deletion of Qdrant collection {qdrant_collection_name}"
        )
    except UnexpectedResponse as e:  # Corrected Qdrant exception
        print(
            f"Qdrant error deleting collection {qdrant_collection_name} (it might not exist or other API issue): {e}"
        )
    except Exception as e:
        print(
            f"Error deleting Qdrant collection {qdrant_collection_name}: {e}. Proceeding with DB deletion."
        )
    # --- End Qdrant Collection Deletion ---

    await db.delete(collection_model)
    await db.commit()
    return None


# --- File Endpoints ---


@router.get(  # Added
    "/{collection_id}/files",  # Added
    response_model=FileListResponse,  # Added
    status_code=status.HTTP_200_OK,  # Added
)  # Added
async def list_files_in_collection(  # Added
    collection_id: uuid.UUID,  # Added
    db: AsyncSession = Depends(get_db),  # Added
    # current_user: User = Depends(get_current_user), # Optional: if files are sensitive # Added
):  # Added
    collection = await get_collection_or_404(collection_id, db)  # Added
    # The collection.files relationship is already eagerly loaded by get_collection_or_404 # Added
    return FileListResponse(
        files=[FileResponse.from_orm(f) for f in collection.files]
    )  # Added


@router.post(
    "/{collection_id}/files/upload",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file_to_collection(
    collection_id: uuid.UUID,
    file: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    collection = await get_collection_or_404(collection_id, db)

    content = await file.read()
    file_size = len(content)
    file_name = file.filename or "untitled"

    file_type = file.content_type
    if not file_type:
        try:
            file_type = magic.from_buffer(content, mime=True)
        except magic.MagicException as e:
            print(f"Magic library error: {e}")
            file_type = "application/octet-stream"
        # Removed the general Exception catch here as MagicException should cover library specific issues.
        # If other errors are expected from from_buffer, they should be caught specifically.

    # Default parsed_content_preview
    parsed_content_preview = f"File type '{file_type}' received. Basic preview. Original filename: {file_name}"

    new_file = FileModel(
        collection_id=collection.id,
        name=file_name,
        type=file_type,
        size=file_size,
        content=content,  # Storing raw bytes, consider if this is always needed if chunked & embedded
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)

    # --- Start New Embedding Process ---
    openai_api_key_present = bool(os.getenv("OPENAI_API_KEY"))
    qdrant_url = os.getenv("QDRANT_URL")

    if openai_api_key_present and qdrant_url:
        try:
            qdrant_api_key = os.getenv("QDRANT_API_KEY")
            # Ensure QDRANT_URL is valid, e.g., "http://localhost:6333" or "http://qdrant:6333"
            qdrant_client = QdrantClient(
                url=qdrant_url, api_key=qdrant_api_key, timeout=10
            )  # Added timeout
            qdrant_collection_name = (
                f"collection_{str(collection_id).replace('-', '_')}"
            )
            vector_size = 1536  # For OpenAI's text-embedding-ada-002

            # Check/Create Qdrant collection
            collection_exists = False
            try:
                # Attempt to get collection info.
                # If this succeeds, the collection exists.
                # If it raises UnexpectedResponse with 404, it doesn't exist.
                # If it raises other errors (like Pydantic ValidationError, or other HTTP errors),
                # then we have an issue that isn't simply "collection not found".
                await run_in_threadpool(
                    qdrant_client.get_collection, collection_name=qdrant_collection_name
                )
                collection_exists = True
                print(f"Qdrant collection '{qdrant_collection_name}' already exists.")

            except UnexpectedResponse as e:
                if e.status_code == 404:
                    print(
                        f"Qdrant collection '{qdrant_collection_name}' not found (404). Will attempt to create."
                    )
                    collection_exists = False
                else:
                    # Some other HTTP error from Qdrant that we weren't expecting.
                    print(
                        f"Unexpected HTTP error when checking Qdrant collection '{qdrant_collection_name}': {e}"
                    )
                    # Propagate the error, as we can't be sure about the collection's state.
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Qdrant error checking collection: {str(e)}",
                    ) from e

            except Exception as e:  # Catches other errors, e.g., Pydantic Validation Error, network issues before HTTP response
                print(
                    f"Error during Qdrant get_collection for '{qdrant_collection_name}': {e}. "
                    "This could be a client/server version mismatch, malformed response, or network issue."
                )
                # Propagate the error. We cannot assume the collection doesn't exist.
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to verify Qdrant collection status: {str(e)}",
                ) from e

            if not collection_exists:
                try:
                    print(
                        f"Attempting to create Qdrant collection '{qdrant_collection_name}'..."
                    )
                    await run_in_threadpool(
                        qdrant_client.create_collection,
                        collection_name=qdrant_collection_name,
                        vectors_config=qdrant_models.VectorParams(
                            size=vector_size, distance=qdrant_models.Distance.COSINE
                        ),
                    )
                    print(
                        f"Qdrant collection '{qdrant_collection_name}' created successfully."
                    )
                except UnexpectedResponse as e_create:
                    print(
                        f"Qdrant API error during collection creation '{qdrant_collection_name}': {e_create}"
                    )
                    # If creation fails, we cannot proceed with embedding.
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Qdrant error creating collection: {str(e_create)}",
                    ) from e_create
                except Exception as e_create_other:
                    print(
                        f"Unexpected error during Qdrant collection creation '{qdrant_collection_name}': {e_create_other}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Unexpected error creating Qdrant collection: {str(e_create_other)}",
                    ) from e_create_other

            text_to_embed = None
            if file_type == "text/plain":
                try:
                    text_to_embed = content.decode("utf-8")
                    parsed_content_preview = (
                        text_to_embed[:200] + "..."
                        if len(text_to_embed) > 200
                        else text_to_embed
                    )
                except UnicodeDecodeError as e:
                    print(f"Unicode decode error for {file_name}: {e}")
                    parsed_content_preview = (
                        f"Error decoding text file. Original filename: {file_name}"
                    )
            elif file_type == "application/pdf":  # Added PDF handling
                try:
                    # --- Using ThuaNNPdfReader ---
                    print("Using ThuaNNPdfReader to parse PDF content...")

                    import tempfile
                    from pathlib import Path

                    with tempfile.NamedTemporaryFile(
                        delete=False, suffix=".pdf"
                    ) as tmp_file:
                        tmp_file.write(content)
                        tmp_file_path = Path(tmp_file.name)

                    pdf_reader = ThuaNNPdfReader()
                    # ThuaNNPdfReader.load_data now returns list[str]
                    extracted_texts = await run_in_threadpool(
                        pdf_reader.load_data, file=tmp_file_path
                    )

                    # Clean up the temporary file
                    os.unlink(tmp_file_path)

                    if extracted_texts:
                        text_to_embed = "\\\\n\\\\n".join(
                            extracted_texts
                        )  # Join pages with double newline
                        parsed_content_preview = (
                            text_to_embed[:200] + "..."
                            if len(text_to_embed) > 200
                            else text_to_embed
                        )
                        print(
                            f"Successfully extracted text from PDF using ThuaNNPdfReader: {file_name}"
                        )
                    else:
                        parsed_content_preview = f"No text extracted from PDF (ThuaNNPdfReader). Original filename: {file_name}"
                        print(
                            f"Warning: No text extracted from PDF '{file_name}' using ThuaNNPdfReader."
                        )
                    # --- End ThuaNNPdfReader ---
                except Exception as e:
                    print(f"Error parsing PDF {file_name} with ThuaNNPdfReader: {e}")
                    parsed_content_preview = f"Error parsing PDF with ThuaNNPdfReader. Original filename: {file_name}"
            # Add more file type handlers here (e.g. DOCX) using appropriate libraries
            # For DOCX: python-docx
            # Example (conceptual, needs library installation and error handling):
            # elif "docx" in file_type:
            #     from docx import Document # Requires python-docx
            #     import io # Added import for io.BytesIO
            #     try:
            #         docx_file = io.BytesIO(content)
            #         doc = Document(docx_file)
            #         text_to_embed = "\\n".join(paragraph.text for paragraph in doc.paragraphs if paragraph.text)
            #         parsed_content_preview = (text_to_embed[:200] + "...") if len(text_to_embed) > 200 else text_to_embed # Corrected conditional expression
            #     except Exception as e:
            #         print(f"Error parsing DOCX {file_name}: {e}")
            #         parsed_content_preview = f"Error parsing DOCX. Original filename: {file_name}"

            if text_to_embed:
                # --- Embedding and Storing ---
                chunk_size = 1000  # Define chunk_size
                chunk_overlap = 200  # Define chunk_overlap

                # Chunk the text for embedding
                text_chunks = chunk_text(
                    text_to_embed, chunk_size, chunk_overlap
                )  # Pass parameters

                if text_chunks:  # Check if text_chunks is not empty
                    embeddings = []
                    # Get embeddings for the chunks
                    # Consider batching if there are many chunks to avoid hitting rate limits
                    for chunk in text_chunks:
                        try:
                            embedding = await get_openai_embedding(chunk)
                            embeddings.append(embedding)
                        except openai.APIError as e:  # More specific OpenAI error
                            print(f"OpenAI API error for a chunk in {file_name}: {e}")
                            # Decide on error handling: skip chunk, retry, or fail fast
                            continue  # Example: skip this chunk
                        except Exception as e:  # Catch other potential errors
                            print(
                                f"Failed to get embedding for a chunk in {file_name}: {e}"
                            )
                            continue  # Example: skip this chunk

                    if embeddings:  # Only store if we got some embeddings
                        await store_chunks_in_qdrant(
                            qdrant_client,
                            qdrant_collection_name,
                            new_file.id,
                            new_file.name,  # Pass file_name
                            text_chunks,  # Use chunked data
                            embeddings,
                        )
                        print(
                            f"File '{file_name}' processed and embedded successfully. Collection: {qdrant_collection_name}"
                        )
                    else:
                        print(
                            f"No embeddings generated for {file_name}, skipping Qdrant storage."
                        )
                else:
                    print(
                        f"No text chunks generated from {file_name}, skipping embedding."
                    )
            else:
                print(
                    f"No valid text content to embed for file '{file_name}'. Skipping embedding."
                )
        except openai.APIError as e:  # More specific OpenAI error
            print(
                f"OpenAI API error during embedding process for file {file_name}: {e}"
            )
            parsed_content_preview += " (Embedding failed due to OpenAI API error)"
        except UnexpectedResponse as e:  # Corrected Qdrant exception
            print(
                f"Qdrant API error during embedding process for file {file_name}: {e}"
            )
            parsed_content_preview += " (Embedding failed due to Qdrant API error)"
        except Exception as e:
            print(f"Overall error during embedding process for file {file_name}: {e}")
            parsed_content_preview += " (Embedding failed)"
    else:
        print(
            f"OpenAI API key or Qdrant URL not set, skipping embedding for file {file_name}."
        )

    # Return the file response including the parsed content preview
    return FileUploadResponse(
        id=new_file.id,
        name=new_file.name,
        type=new_file.type,
        size=new_file.size,
        collection_id=new_file.collection_id,
        # content=parsed_content_preview, # Removed raw content for security/privacy
        parsed_content_preview=parsed_content_preview,  # Return the preview of parsed content
        # created_at=new_file.created_at, # Corrected to uploaded_at
        uploaded_at=new_file.uploaded_at,
    )


# --- End File Endpoints ---

# --- File Deletion Endpoint ---

@router.delete(
    "/{collection_id}/files/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_file_from_collection(
    collection_id: uuid.UUID,
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user), # Require auth to delete
):
    collection = await get_collection_or_404(collection_id, db)

    # Find the file in the database
    file_model = await db.get(FileModel, file_id)
    if not file_model or file_model.collection_id != collection.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in this collection.",
        )

    # --- Start Qdrant Point Deletion ---
    qdrant_url = os.getenv("QDRANT_URL")
    openai_api_key_present = bool(os.getenv("OPENAI_API_KEY"))

    if openai_api_key_present and qdrant_url:
        try:
            qdrant_api_key = os.getenv("QDRANT_API_KEY")
            qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key, timeout=10)
            qdrant_collection_name = f"collection_{str(collection_id).replace('-', '_')}"

            print(f"Attempting to delete points for file_id '{file_id}' from Qdrant collection '{qdrant_collection_name}'")

            # Check if collection exists before attempting to delete points
            try:
                await run_in_threadpool(qdrant_client.get_collection, collection_name=qdrant_collection_name)
                # Collection exists, proceed to delete points
                await run_in_threadpool(
                    qdrant_client.delete, # Corrected: Changed delete_points to delete
                    collection_name=qdrant_collection_name,
                    points_selector=qdrant_models.FilterSelector(
                        filter=qdrant_models.Filter(
                            must=[
                                qdrant_models.FieldCondition(
                                    key="file_id",
                                    match=qdrant_models.MatchValue(value=str(file_id)),
                                )
                            ]
                        )
                    ),
                )
                print(f"Successfully deleted points for file_id '{file_id}' from Qdrant collection '{qdrant_collection_name}' or points did not exist.")
            except UnexpectedResponse as e:
                if e.status_code == 404:
                    print(f"Qdrant collection '{qdrant_collection_name}' not found. No points to delete for file_id '{file_id}'.")
                else:
                    # Other Qdrant error, log it but proceed with DB deletion
                    print(f"Qdrant API error when checking/deleting points for file_id '{file_id}': {e}")
            except Exception as e:
                # Catch other errors during Qdrant interaction
                print(f"Unexpected error during Qdrant point deletion for file_id '{file_id}': {e}. Proceeding with DB deletion.")

        except Exception as e:
            # This catches errors like Qdrant client initialization
            print(f"Failed to initialize Qdrant client or other setup error during file deletion: {e}. Proceeding with DB deletion.")
    else:
        print(f"OpenAI API key or Qdrant URL not set, skipping Qdrant point deletion for file_id '{file_id}'.")
    # --- End Qdrant Point Deletion ---

    # Delete the file from the database
    await db.delete(file_model)
    await db.commit()

    return None
# --- End File Deletion Endpoint ---


# --- Chunk Endpoints --- # Added


@router.get(  # Added
    "/{collection_id}/files/{file_id}/chunks",  # Added
    response_model=ChunkListResponse,  # Added
    status_code=status.HTTP_200_OK,  # Added
)  # Added
async def list_file_chunks(  # Added
    collection_id: uuid.UUID,  # Added
    file_id: uuid.UUID,  # Added
    db: AsyncSession = Depends(get_db),  # Added
    # current_user: User = Depends(get_current_user), # Optional # Added
):  # Added
    collection = await get_collection_or_404(collection_id, db)  # Added
    # Verify file belongs to collection (optional, but good practice) # Added
    file_model = await db.get(FileModel, file_id)  # Added
    if (
        not file_model or file_model.collection_id != collection.id
    ):  # Changed collection_id to collection.id
        raise HTTPException(  # Added
            status_code=status.HTTP_404_NOT_FOUND,  # Added
            detail="File not found in this collection.",  # Added
        )  # Added

    qdrant_collection_name = (
        f"collection_{str(collection_id).replace('-', '_')}"  # Added
    )
    chunks = []  # Added

    try:  # Added
        qdrant_url = os.getenv("QDRANT_URL", "http://qdrant:6333")  # Added
        qdrant_api_key = os.getenv("QDRANT_API_KEY")  # Added
        qdrant_client = QdrantClient(
            url=qdrant_url, api_key=qdrant_api_key, timeout=10
        )  # Added

        # Scroll through all points for the given file_id # Added
        # This might need pagination for very large numbers of chunks # Added
        scroll_response, _next_page_offset = await run_in_threadpool(  # Added
            qdrant_client.scroll,  # Added
            collection_name=qdrant_collection_name,  # Added
            scroll_filter=qdrant_models.Filter(  # Added
                must=[  # Added
                    qdrant_models.FieldCondition(  # Added
                        key="file_id",  # Added
                        match=qdrant_models.MatchValue(value=str(file_id)),  # Added
                    )  # Added
                ]  # Added
            ),  # Added
            limit=1000,  # Adjust limit as needed, or implement pagination # Added
            with_payload=True,  # Added
            with_vectors=False,  # We don't need the vectors themselves # Added
        )  # Added

        for point in scroll_response:  # Added
            if point.payload:  # Added
                chunks.append(  # Added
                    ChunkResponse(  # Added
                        id=point.id,  # Added
                        text=point.payload.get("text", ""),  # Added
                        file_id=uuid.UUID(point.payload.get("file_id"))
                        if point.payload.get("file_id")
                        else None,  # Added
                        file_name=point.payload.get("file_name", ""),  # Added
                        chunk_sequence=point.payload.get("chunk_sequence", -1),  # Added
                    )  # Added
                )  # Added
        # Add proper pagination here if _next_page_offset is not None # Added
        # For now, we just fetch up to the limit # Added

    except UnexpectedResponse as e:  # Added
        print(
            f"Qdrant collection '{qdrant_collection_name}' not found or API error: {e}"
        )  # Added
        # If collection doesn't exist, no chunks to return # Added
    except Exception as e:  # Added
        print(
            f"Unexpected error fetching chunks from Qdrant for file {file_id}: {e}"
        )  # Added
        raise HTTPException(  # Added
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,  # Added
            detail=f"Unexpected error fetching chunks: {str(e)}",  # Added
        ) from e  # Added

    return ChunkListResponse(chunks=chunks)  # Added
