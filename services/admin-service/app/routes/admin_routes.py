"""
Admin API Routes
Administrative endpoints for system management
"""
from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ==================== Request/Response Models ====================

class SystemConfigUpdate(BaseModel):
    """Model for updating system configuration"""
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    top_k_results: Optional[int] = None

# ==================== Admin Endpoints ====================

@router.get("/system/info")
async def get_system_info(request: Request = None):
    """Get system information"""
    try:
        from app.config import settings
        
        return {
            "status": "success",
            "system": {
                "service_name": settings.SERVICE_NAME,
                "version": "1.0.0",
                "llm_model": settings.GEMINI_MODEL,
                "embedding_model": settings.EMBEDDING_MODEL,
                "chunk_size": settings.CHUNK_SIZE,
                "chunk_overlap": settings.CHUNK_OVERLAP,
                "top_k_results": settings.TOP_K_RESULTS,
                "vector_dimension": settings.VECTOR_DIMENSION
            }
        }
    except Exception as e:
        logger.error(f"Error getting system info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/health")
async def system_health(request: Request = None):
    """Detailed health check"""
    try:
        # Check all components
        db = request.app.state.db
        vector_store = request.app.state.vector_store
        
        db_health = await db.health_check()
        vector_health = vector_store.is_initialized()
        
        overall_status = "healthy" if (db_health and vector_health) else "unhealthy"
        
        return {
            "status": overall_status,
            "components": {
                "database": "connected" if db_health else "disconnected",
                "vector_store": "initialized" if vector_health else "not_initialized",
                "llm": "ready",
                "document_processor": "ready"
            }
        }
    except Exception as e:
        logger.error(f"Error checking health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/system/clear-vector-store")
async def clear_vector_store(request: Request = None):
    """Clear all vectors from the vector store (DANGEROUS!)"""
    try:
        vector_store = request.app.state.vector_store
        vector_store.clear()
        
        logger.warning("⚠️ Vector store cleared!")
        
        return {
            "status": "success",
            "message": "Vector store cleared successfully",
            "warning": "All vector embeddings have been deleted"
        }
    except Exception as e:
        logger.error(f"Error clearing vector store: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs/recent")
async def get_recent_logs(lines: int = 100):
    """Get recent log entries"""
    try:
        # This is a simple implementation
        # In production, you'd want to read from actual log files
        return {
            "status": "success",
            "message": "Log retrieval not implemented in this version",
            "lines": lines
        }
    except Exception as e:
        logger.error(f"Error getting logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/conversations/{user_id}")
async def get_user_conversations(
    user_id: str,
    limit: int = 10,
    request: Request = None
):
    """Get conversation history for a user"""
    try:
        db = request.app.state.db
        conversations = await db.get_conversation_history(user_id, limit=limit)
        
        return {
            "status": "success",
            "user_id": user_id,
            "count": len(conversations),
            "conversations": conversations
        }
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
