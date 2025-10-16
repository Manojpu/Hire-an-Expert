"""
Admin Service with RAG System
Uses Gemini 1.5 Flash, FAISS, MongoDB, and LangChain
"""
import os
import sys
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import logging

# Import RAG components
from app.rag.vector_store import FAISSVectorStore
from app.rag.document_processor import DocumentProcessor
from app.rag.gemini_service import GeminiService
from app.rag.rag_engine import RAGEngine
from app.database.mongodb import MongoDB
from app.routes import rag_routes, admin_routes, analytics_routes
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Global instances
vector_store = None
rag_engine = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    global vector_store, rag_engine, db
    
    try:
        logger.info("🚀 Starting Admin Service with RAG System...")
        
        # Initialize MongoDB
        db = MongoDB()
        await db.connect()
        app.state.db = db
        logger.info("✅ MongoDB connected")
        
        # Initialize Vector Store with MongoDB for persistence
        vector_store = FAISSVectorStore(db=db)
        await vector_store.initialize()
        app.state.vector_store = vector_store
        logger.info("✅ FAISS Vector Store initialized")
        
        # Initialize Gemini Service
        gemini_service = GeminiService()
        app.state.gemini_service = gemini_service
        logger.info("✅ Gemini 1.5 Flash initialized")
        
        # Initialize Document Processor
        doc_processor = DocumentProcessor()
        app.state.doc_processor = doc_processor
        logger.info("✅ Document Processor initialized")
        
        # Initialize RAG Engine
        rag_engine = RAGEngine(
            vector_store=vector_store,
            gemini_service=gemini_service,
            doc_processor=doc_processor,
            db=db
        )
        app.state.rag_engine = rag_engine
        logger.info("✅ RAG Engine initialized")
        
        logger.info("🎉 Admin Service is ready!")
        
        yield
        
        # Cleanup
        logger.info("🛑 Shutting down Admin Service...")
        await db.disconnect()
        logger.info("✅ MongoDB disconnected")
        
    except Exception as e:
        logger.error(f"❌ Error during startup: {str(e)}")
        raise

# Create FastAPI app
app = FastAPI(
    title="Admin Service with RAG",
    description="Admin service with Retrieval-Augmented Generation system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(rag_routes.router, prefix="/api/rag", tags=["RAG"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])
app.include_router(analytics_routes.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Admin Service with RAG",
        "version": "1.0.0",
        "status": "running",
        "features": {
            "rag": "Enabled",
            "llm": "Gemini 1.5 Flash",
            "vector_db": "FAISS",
            "database": "MongoDB",
            "framework": "LangChain"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB
        db_status = await app.state.db.health_check()
        
        # Check Vector Store
        vector_status = app.state.vector_store.is_initialized()
        
        return {
            "status": "healthy",
            "database": "connected" if db_status else "disconnected",
            "vector_store": "initialized" if vector_status else "not initialized",
            "rag_engine": "ready" if app.state.rag_engine else "not ready"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8009))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
