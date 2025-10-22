"""
Lightweight RAG Routes for Admin Service
Handles document upload, query, list, and delete operations
"""
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

logger = logging.getLogger(__name__)

router = APIRouter()


def _rag_unavailable_detail(request: Request) -> str:
    reasons = getattr(request.app.state, "rag_disabled_reasons", []) or []
    if reasons:
        return "RAG features are disabled: " + ", ".join(reasons)
    return "RAG features are currently disabled. Configure Pinecone and Gemini credentials to enable them."


def _require_rag_engine(request: Request):
    rag_engine = getattr(request.app.state, "rag_engine", None)
    if not rag_engine:
        raise HTTPException(status_code=503, detail=_rag_unavailable_detail(request))
    return rag_engine


def _require_pinecone(request: Request):
    pinecone_service = getattr(request.app.state, "pinecone_service", None)
    if not pinecone_service:
        raise HTTPException(status_code=503, detail=_rag_unavailable_detail(request))
    return pinecone_service


def _require_mongodb(request: Request):
    mongodb_service = getattr(request.app.state, "mongodb_service", None)
    if not mongodb_service:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    return mongodb_service


class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


class QueryResponse(BaseModel):
    success: bool
    answer: str
    sources: list
    context_used: int
    model: Optional[str] = None


@router.post("/upload")
async def upload_document(request: Request, file: UploadFile = File(...)):
    try:
        rag_engine = _require_rag_engine(request)
        filename = file.filename
        file_ext = filename.lower().split('.')[-1]
        
        if file_ext not in ['pdf', 'txt']:
            raise HTTPException(status_code=400, detail=f"Unsupported file type")
        
        file_content = await file.read()
        
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        result = await rag_engine.process_and_store_document(filename=filename, file_content=file_content)
        
        return {"success": True, "message": f"Document processed successfully", "data": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query", response_model=QueryResponse)
async def query_rag(request: Request, query_request: QueryRequest):
    try:
        rag_engine = _require_rag_engine(request)
        
        if not query_request.query or len(query_request.query.strip()) == 0:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        result = await rag_engine.query(query_text=query_request.query, top_k=query_request.top_k)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_documents(request: Request, limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    try:
        rag_engine = _require_rag_engine(request)
        documents = await rag_engine.list_documents(limit=limit, skip=skip)
        mongodb_service = _require_mongodb(request)
        total_count = await mongodb_service.get_document_count()
        
        return {"success": True, "total": total_count, "count": len(documents), "documents": documents}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{doc_id}")
async def delete_document(request: Request, doc_id: str):
    try:
        rag_engine = _require_rag_engine(request)
        deleted = await rag_engine.delete_document(doc_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Document not found")
        
        return {"success": True, "message": f"Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats(request: Request):
    try:
        rag_engine = _require_rag_engine(request)
        pinecone = _require_pinecone(request)
        
        pinecone_stats = await pinecone.get_stats()
        doc_count = await rag_engine.mongodb.get_document_count()
        
        return {
            "success": True,
            "stats": {
                "total_documents": doc_count,
                "pinecone": pinecone_stats,
                "chunk_size": 500,
                "chunk_overlap": 50,
                "embedding_model": "embedding-001"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Frontend-Compatible Endpoints ====================

@router.post("/ingest/file")
async def ingest_file(request: Request, file: UploadFile = File(...)):
    """Frontend-compatible file upload endpoint"""
    try:
        rag_engine = _require_rag_engine(request)
        filename = file.filename
        file_ext = filename.lower().split('.')[-1]
        
        if file_ext not in ['pdf', 'txt']:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
        
        file_content = await file.read()
        
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        result = await rag_engine.process_and_store_document(filename=filename, file_content=file_content)
        
        return {
            "status": "success",
            "message": f"File {filename} ingested successfully",
            "document_id": result['doc_id'],
            "chunks_created": result['chunk_count'],
            "embeddings_created": result['embeddings_created']
        }
        
    except Exception as e:
        logger.error(f"Error in ingest/file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class TextIngestRequest(BaseModel):
    text: str
    title: str
    metadata: Optional[dict] = None


@router.post("/ingest/text")
async def ingest_text(request: Request, data: TextIngestRequest):
    """Frontend-compatible text upload endpoint"""
    try:
        rag_engine = _require_rag_engine(request)
        
        # Convert text to bytes for processing
        text_content = data.text.encode('utf-8')
        filename = f"{data.title}.txt"
        
        result = await rag_engine.process_and_store_document(
            filename=filename,
            file_content=text_content,
            metadata=data.metadata
        )
        
        return {
            "status": "success",
            "message": f"Text '{data.title}' ingested successfully",
            "document_id": result['doc_id'],
            "chunks_created": result['chunk_count']
        }
        
    except Exception as e:
        logger.error(f"Error in ingest/text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
async def get_documents(request: Request, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    """Frontend-compatible list documents endpoint"""
    try:
        rag_engine = _require_rag_engine(request)
        documents = await rag_engine.list_documents(limit=limit, skip=skip)
        mongodb_service = _require_mongodb(request)
        total_count = await mongodb_service.get_document_count()
        
        # Transform documents to include frontend-expected fields
        formatted_docs = []
        for doc in documents:
            formatted_doc = {
                "_id": doc["_id"],
                "title": doc.get("filename", "Untitled"),
                "filename": doc.get("filename"),
                "file_type": doc.get("file_type"),
                "source_type": doc.get("file_type", "file"),
                "content": f"Document with {doc.get('chunk_count', 0)} chunks",
                "created_at": doc.get("upload_date"),
                "metadata": {
                    "chunks": [{"index": i} for i in range(doc.get("chunk_count", 0))],
                    "file_size": doc.get("size"),
                    "chunk_count": doc.get("chunk_count", 0)
                }
            }
            formatted_docs.append(formatted_doc)
        
        return {
            "status": "success",
            "count": len(formatted_docs),
            "total": total_count,
            "documents": formatted_docs
        }
        
    except Exception as e:
        logger.error(f"Error in get documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}")
async def delete_document_by_id(request: Request, document_id: str):
    """Frontend-compatible delete document endpoint"""
    try:
        rag_engine = _require_rag_engine(request)
        deleted = await rag_engine.delete_document(document_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Document not found: {document_id}")
        
        return {
            "status": "success",
            "message": f"Document {document_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    user_id: Optional[str] = None
    use_context: bool = True


@router.post("/chat")
async def chat(request: Request, data: ChatRequest):
    """
    Chat endpoint with RAG context
    Supports conversational queries with context from documents
    """
    try:
        rag_engine = _require_rag_engine(request)
        
        # Get the last user message
        user_messages = [msg for msg in data.messages if msg.role == "user"]
        if not user_messages:
            raise HTTPException(status_code=400, detail="No user message found")
        
        last_message = user_messages[-1].content
        
        logger.info(f"Chat request: {last_message[:50]}...")
        
        # If use_context is True, query the RAG system
        if data.use_context:
            result = await rag_engine.query(query_text=last_message, top_k=5)
            
            return {
                "status": "success",
                "response": result['answer'],
                "message": result['answer'],
                "sources": result.get('sources', []),
                "context_used": result.get('context_used', 0),
                "model": result.get('model', 'gemini-2.0-flash-exp')
            }
        else:
            # Direct LLM query without RAG context
            gemini_service = getattr(request.app.state, "gemini_service", None)
            if not gemini_service:
                raise HTTPException(status_code=503, detail=_rag_unavailable_detail(request))
            answer_result = gemini_service.generate_answer(last_message, [])
            
            return {
                "status": "success",
                "response": answer_result['answer'],
                "message": answer_result['answer'],
                "sources": [],
                "context_used": 0,
                "model": answer_result.get('model', 'gemini-2.0-flash-exp')
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
