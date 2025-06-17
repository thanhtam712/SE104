import os
import uuid
from datetime import datetime
from typing import Optional, List  # Added List
import json  # Added json for printing the prompt

import load_dotenv
import openai
from api.middleware.jwt_auth import get_current_user
from bootstrap.db import get_db
from fastapi import APIRouter, Depends, status
from internal.respond import respond_http
from models.conversation import Conversation
from models.message import Message
from models.user import User
from models.collection import Collection  # Added Collection import
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Added Qdrant imports
from qdrant_client import QdrantClient, models as qdrant_models
from fastapi.concurrency import run_in_threadpool

load_dotenv.load_dotenv()


openai.api_key = os.getenv(
    "OPENAI_API_KEY"
)  # Changed from OPENAI to OPENAI_API_KEY to match collection_manager.py
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")


class CreateConversationRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    conversation_id: Optional[uuid.UUID] = None


class CreateConversationResponse(BaseModel):
    conversation_id: uuid.UUID
    user_message: str
    bot_message: str
    created_at: datetime


router = APIRouter()


@router.post(
    "/create",
    response_model=CreateConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    request: CreateConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --- Start RAG - Retrieve Context from Qdrant ---
    retrieved_context_str = ""
    all_relevant_chunks = []  # Store chunks from all active collections

    if QDRANT_URL and openai.api_key:  # Ensure Qdrant and OpenAI are configured
        try:
            qdrant_client = QdrantClient(
                url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=10
            )

            # 1. Get all active collections from the database
            active_collections_result = await db.execute(
                select(Collection).where(Collection.is_active == True)
            )
            active_collections = active_collections_result.scalars().all()

            if not active_collections:
                print("No active collections found. Skipping RAG.")
            else:
                print(
                    f"Found {len(active_collections)} active collections. Querying them for context..."
                )

                # 2. Get embedding for the user's message (once)
                query_embedding_response = await openai.Embedding.acreate(
                    input=[request.message], model="text-embedding-ada-002"
                )
                query_vector = query_embedding_response.data[0].embedding

                # 3. Search each active Qdrant collection
                for collection_model in active_collections:
                    qdrant_collection_name = (
                        f"collection_{str(collection_model.id).replace('-', '_')}"
                    )
                    print(
                        f"Attempting to query Qdrant collection: {qdrant_collection_name} for user message: {request.message}"
                    )

                    try:
                        # Check if collection exists in Qdrant before searching
                        try:
                            collection_info = await run_in_threadpool(
                                qdrant_client.get_collection,
                                collection_name=qdrant_collection_name,
                            )
                            print(
                                f"Collection '{qdrant_collection_name}' exists in Qdrant. Points count: {collection_info.points_count}"
                            )
                        except Exception as e:
                            # Handle cases where collection might not exist in Qdrant or other Qdrant client errors for this specific collection
                            print(
                                f"Could not get info for Qdrant collection '{qdrant_collection_name}'. It might not exist or Qdrant is unavailable. Error: {e}. Skipping this collection."
                            )
                            continue  # Skip to the next collection

                        search_result = await run_in_threadpool(
                            qdrant_client.search,
                            collection_name=qdrant_collection_name,
                            query_vector=query_vector,
                            limit=5,  # Retrieve top 5 relevant chunks per collection
                        )

                        for hit in search_result:
                            if hit.payload and "text" in hit.payload:
                                all_relevant_chunks.append(hit.payload["text"])
                        print(
                            f"Found {len(search_result)} hits in '{qdrant_collection_name}'."
                        )
                    except Exception as e:
                        print(
                            f"Error searching Qdrant collection '{qdrant_collection_name}': {e}. Skipping this collection."
                        )
                        continue  # Skip to the next collection

                if all_relevant_chunks:
                    retrieved_context_str = (
                        "\\\\n\\\\n---\\\\nRelevant Information (from active collections):\\\\n"
                        + "\\\\n\\\\n".join(all_relevant_chunks)
                        + "\\\\n---\\\\n\\\\n"
                    )
                    print(
                        f"Total relevant chunks retrieved from all active collections: {len(all_relevant_chunks)}"
                    )
                    print(f"Aggregated context: {retrieved_context_str}")
                else:
                    print("No relevant chunks found in any active Qdrant collections.")

        except openai.APIError as e:
            print(f"OpenAI API error during RAG query embedding: {e}")
        except Exception as e:
            print(f"Error during RAG context retrieval: {e}")
    else:
        missing_configs = []
        if not QDRANT_URL:
            missing_configs.append("QDRANT_URL")
        if not openai.api_key:
            missing_configs.append("OPENAI_API_KEY")
        print(
            f"Skipping RAG: Missing environment variables: {', '.join(missing_configs)}"
        )
    # --- End RAG ---

    try:
        # Prepend retrieved context to the user's message for the prompt
        prompt_to_gpt = retrieved_context_str + request.message

        messages_for_gpt = [
            {
                "role": "system",
                "content": "You are an admission chatbot. Use the provided 'Relevant Information' to answer the user's query. If the information is not relevant or not sufficient, answer based on your general knowledge.",
            },
            {"role": "user", "content": prompt_to_gpt},
        ]

        print("\\n--- PROMPT FOR GPT ---")
        print(json.dumps(messages_for_gpt, indent=2))
        print("--- END PROMPT FOR GPT ---\\n")

        response = openai.ChatCompletion.create(  # Corrected to use openai.ChatCompletion.create
            model="gpt-4.1-mini",  # Or your desired model
            messages=messages_for_gpt,
        )
        bot_message_text = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling GPT API: {e}")
        bot_message_text = "Sorry, I'm having trouble connecting to my brain right now. Please try again later."

    conversation_id_to_return = None
    created_at_to_return = None
    conversation = None

    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalars().first()

        if not conversation:
            return await respond_http(
                status_code=status.HTTP_404_NOT_FOUND,
                message_code="CONVERSATION_NOT_FOUND",
                message="Conversation not found or access denied.",
            )

        conversation_id_to_return = conversation.id
        created_at_to_return = conversation.created_at

    else:
        conversation = Conversation(
            user_id=current_user.id,
        )
        db.add(conversation)
        await db.flush()
        conversation_id_to_return = conversation.id
        created_at_to_return = conversation.created_at

    user_message_obj = Message(
        conversation_id=conversation_id_to_return,
        sender_type="user",
        content=request.message,
    )
    db.add(user_message_obj)

    bot_message_obj = Message(
        conversation_id=conversation_id_to_return,
        sender_type="bot",
        content=bot_message_text,
    )
    db.add(bot_message_obj)

    await db.commit()

    return CreateConversationResponse(
        conversation_id=conversation_id_to_return,
        user_message=request.message,
        bot_message=bot_message_text,
        created_at=created_at_to_return,
    )
