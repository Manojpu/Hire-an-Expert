"""
Analytics API Routes
Endpoints for analytics and reporting
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ==================== Analytics Endpoints ====================

@router.get("/overview")
async def get_analytics_overview(request: Request = None):
    """Get analytics overview"""
    try:
        db = request.app.state.db
        vector_store = request.app.state.vector_store
        
        # Get stats from database
        doc_count = await db.get_document_count()
        conv_count = await db.get_conversation_count()
        recent_activity = await db.get_recent_activity()
        
        # Get vector store stats
        vector_stats = vector_store.get_stats()
        
        return {
            "status": "success",
            "overview": {
                "total_documents": doc_count,
                "total_conversations": conv_count,
                "total_vectors": vector_stats["total_vectors"],
                "recent_activity": recent_activity
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting analytics overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/stats")
async def get_document_stats(request: Request = None):
    """Get document statistics"""
    try:
        db = request.app.state.db
        
        # Get all documents
        documents = await db.get_all_documents(skip=0, limit=1000)
        
        # Calculate stats
        total_docs = len(documents)
        
        # Group by source type
        source_types = {}
        for doc in documents:
            source_type = doc.get("source_type", "unknown")
            source_types[source_type] = source_types.get(source_type, 0) + 1
        
        return {
            "status": "success",
            "stats": {
                "total_documents": total_docs,
                "by_source_type": source_types,
                "recent_documents": documents[:10]
            }
        }
    except Exception as e:
        logger.error(f"Error getting document stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/stats")
async def get_conversation_stats(request: Request = None):
    """Get conversation statistics"""
    try:
        db = request.app.state.db
        
        total_conversations = await db.get_conversation_count()
        
        return {
            "status": "success",
            "stats": {
                "total_conversations": total_conversations
            }
        }
    except Exception as e:
        logger.error(f"Error getting conversation stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage/summary")
async def get_usage_summary(days: int = 7, request: Request = None):
    """Get usage summary for the last N days"""
    try:
        db = request.app.state.db
        
        # This is a simplified version
        # In production, you'd want more detailed tracking
        
        activity = await db.get_recent_activity(limit=100)
        
        return {
            "status": "success",
            "period": f"Last {days} days",
            "summary": {
                "total_documents": activity["total_documents"],
                "total_conversations": activity["total_conversations"],
                "recent_documents": activity["recent_documents"],
                "recent_conversations": activity["recent_conversations"]
            }
        }
    except Exception as e:
        logger.error(f"Error getting usage summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
