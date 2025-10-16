"""
RAG API Routes
Endpoints for document ingestion, querying, and management
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel
import os
import shutil
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ==================== Request/Response Models ====================

class TextIngestRequest(BaseModel):
    """Request model for ingesting raw text"""
    text: str
    title: str
    source_type: str = "text"
    metadata: Optional[dict] = None

class QueryRequest(BaseModel):
    """Request model for querying"""
    question: str
    user_id: Optional[str] = None
    top_k: Optional[int] = None
    include_sources: bool = True

class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    """Request model for chat"""
    messages: List[ChatMessage]
    user_id: Optional[str] = None
    use_context: bool = True

# ==================== Helper Functions ====================

def get_rag_engine(request: Request):
    """Get RAG engine from app state"""
    return request.app.state.rag_engine

# ==================== Document Ingestion Endpoints ====================

@router.post("/ingest/file")
async def ingest_file(
    file: UploadFile = File(...),
    source_type: str = "file",
    request: Request = None
):
    """
    Ingest a file into the RAG system
    
    Supports: PDF, TXT, DOCX, MD files
    """
    try:
        rag_engine = get_rag_engine(request)
        
        # Validate file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        from app.config import settings
        
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not supported. Allowed: {settings.ALLOWED_EXTENSIONS}"
            )
        
        # Save uploaded file temporarily
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        temp_file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Ingest the file
        result = await rag_engine.ingest_file(
            file_path=temp_file_path,
            source_type=source_type,
            additional_metadata={"original_filename": file.filename}
        )
        
        # Clean up temp file (optional - you may want to keep it)
        # os.remove(temp_file_path)
        
        logger.info(f"✅ File {file.filename} ingested successfully")
        
        return {
            "status": "success",
            "message": f"File {file.filename} ingested successfully",
            **result
        }
        
    except Exception as e:
        logger.error(f"Error ingesting file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest/text")
async def ingest_text(
    data: TextIngestRequest,
    request: Request = None
):
    """
    Ingest raw text into the RAG system
    """
    try:
        rag_engine = get_rag_engine(request)
        
        result = await rag_engine.ingest_text(
            text=data.text,
            title=data.title,
            source_type=data.source_type,
            additional_metadata=data.metadata
        )
        
        logger.info(f"✅ Text '{data.title}' ingested successfully")
        
        return {
            "status": "success",
            "message": f"Text '{data.title}' ingested successfully",
            **result
        }
        
    except Exception as e:
        logger.error(f"Error ingesting text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Query Endpoints ====================

@router.post("/query")
async def query(
    data: QueryRequest,
    request: Request = None
):
    """
    Query the RAG system
    
    Returns an answer based on the knowledge base
    """
    try:
        rag_engine = get_rag_engine(request)
        
        result = await rag_engine.query(
            question=data.question,
            user_id=data.user_id,
            top_k=data.top_k,
            include_sources=data.include_sources
        )
        
        return {
            "status": "success",
            "question": data.question,
            **result
        }
        
    except Exception as e:
        logger.error(f"Error querying: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query/stream")
async def query_stream(
    data: QueryRequest,
    request: Request = None
):
    """
    Query with streaming response
    """
    try:
        rag_engine = get_rag_engine(request)
        
        async def generate():
            async for chunk in rag_engine.query_streaming(
                question=data.question,
                user_id=data.user_id,
                top_k=data.top_k
            ):
                yield chunk
        
        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        logger.error(f"Error in streaming query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(
    data: ChatRequest,
    request: Request = None
):
    """
    Chat with RAG context
    
    Maintains conversation history and uses RAG for context
    """
    try:
        rag_engine = get_rag_engine(request)
        
        # Convert Pydantic models to dicts
        messages = [{"role": msg.role, "content": msg.content} for msg in data.messages]
        
        result = await rag_engine.chat(
            messages=messages,
            user_id=data.user_id,
            use_context=data.use_context
        )
        
        return {
            "status": "success",
            **result
        }
        
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Document Management Endpoints ====================

@router.get("/documents")
async def list_documents(
    skip: int = 0,
    limit: int = 50,
    request: Request = None
):
    """
    List all documents in the system
    """
    try:
        rag_engine = get_rag_engine(request)
        documents = await rag_engine.list_documents(skip=skip, limit=limit)
        
        return {
            "status": "success",
            "count": len(documents),
            "documents": documents
        }
        
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/{document_id}")
async def get_document(
    document_id: str,
    request: Request = None
):
    """
    Get a specific document
    """
    try:
        rag_engine = get_rag_engine(request)
        document = await rag_engine.get_document(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "status": "success",
            "document": document
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    request: Request = None
):
    """
    Delete a document from the system
    """
    try:
        rag_engine = get_rag_engine(request)
        success = await rag_engine.delete_document(document_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "status": "success",
            "message": f"Document {document_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/{document_id}/view")
async def view_document_file(
    document_id: str,
    request: Request = None
):
    """
    View/Download the original file for a document
    """
    try:
        from fastapi.responses import StreamingResponse
        import io
        
        rag_engine = get_rag_engine(request)
        
        # Get document metadata
        document = await rag_engine.get_document(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Check if file is stored in GridFS
        file_id = document.get("file_id")
        if not file_id:
            raise HTTPException(
                status_code=404, 
                detail="Original file not available (text-only document)"
            )
        
        # Get file from GridFS
        file_data = await rag_engine.db.get_file_data(file_id)
        
        # Determine content type
        filename = document.get("filename", "document.pdf")
        file_ext = document.get("file_type", ".pdf")
        content_type = rag_engine._get_content_type(file_ext)
        
        # Return file as streaming response
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type=content_type,
            headers={
                "Content-Disposition": f'inline; filename="{filename}"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error viewing document file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Statistics Endpoints ====================

@router.get("/stats")
async def get_stats(request: Request = None):
    """
    Get RAG system statistics
    """
    try:
        rag_engine = get_rag_engine(request)
        stats = await rag_engine.get_stats()
        
        return {
            "status": "success",
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/{query}")
async def search_documents(
    query: str,
    k: int = 5,
    request: Request = None
):
    """
    Search for similar documents (vector search only)
    """
    try:
        vector_store = request.app.state.vector_store
        results = vector_store.search(query, k=k)
        
        return {
            "status": "success",
            "query": query,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error searching: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
