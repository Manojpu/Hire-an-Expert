"""
Lightweight Admin Service with RAG System
Uses Gemini for embeddings and LLM, Pinecone for vectors, MongoDB for storage
"""
import os
import sys
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging

# Import RAG components
from app.services.document_processor import DocumentProcessor
from app.services.gemini_service import GeminiService
from app.services.pinecone_service import PineconeService
from app.services.mongodb_service import MongoDBService
from app.services.rag_engine import RAGEngine
from app.routes import rag_routes, admin_routes, analytics_routes
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    
    app.state.mongodb_service = None
    app.state.pinecone_service = None
    app.state.gemini_service = None
    app.state.doc_processor = None
    app.state.rag_engine = None
    app.state.rag_disabled_reasons: List[str] = []

    try:
        logger.info("🚀 Starting Lightweight Admin Service with RAG System...")
        
        # Initialize MongoDB
        mongodb_service = MongoDBService()
        await mongodb_service.connect()
        app.state.mongodb_service = mongodb_service
        logger.info("✅ MongoDB connected")
        
        # Initialize Pinecone
        pinecone_service = None
        pinecone_error: Optional[str] = None
        if settings.PINECONE_API_KEY:
            try:
                pinecone_service = PineconeService()
                await pinecone_service.initialize()
                app.state.pinecone_service = pinecone_service
                logger.info("✅ Pinecone initialized")
            except Exception as err:
                pinecone_error = str(err)
                logger.warning("⚠️  Pinecone disabled: %s", pinecone_error)
        else:
            pinecone_error = "PINECONE_API_KEY missing"
            logger.warning("⚠️  Pinecone disabled: missing PINECONE_API_KEY")
        
        # Initialize Gemini Service
        gemini_service = None
        gemini_error: Optional[str] = None
        if settings.GOOGLE_API_KEY:
            try:
                gemini_service = GeminiService()
                app.state.gemini_service = gemini_service
                logger.info("✅ Gemini service initialized")
            except Exception as err:
                gemini_error = str(err)
                logger.warning("⚠️  Gemini disabled: %s", gemini_error)
        else:
            gemini_error = "GOOGLE_API_KEY missing"
            logger.warning("⚠️  Gemini disabled: missing GOOGLE_API_KEY")
        
        if pinecone_error:
            app.state.rag_disabled_reasons.append(f"Pinecone unavailable: {pinecone_error}")
        if gemini_error:
            app.state.rag_disabled_reasons.append(f"Gemini unavailable: {gemini_error}")
        
        # Initialize Document Processor
        if pinecone_service and gemini_service:
            doc_processor = DocumentProcessor(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP
            )
            app.state.doc_processor = doc_processor
            logger.info("✅ Document Processor initialized")
            
            # Initialize RAG Engine
            rag_engine = RAGEngine(
                doc_processor=doc_processor,
                gemini_service=gemini_service,
                pinecone_service=pinecone_service,
                mongodb_service=mongodb_service
            )
            app.state.rag_engine = rag_engine
            logger.info("✅ RAG Engine initialized")
        else:
            logger.warning(
                "⚠️  RAG features disabled: %s",
                ", ".join(app.state.rag_disabled_reasons) if app.state.rag_disabled_reasons else "unknown reason"
            )
        
        logger.info("🎉 Lightweight Admin Service is ready!")
        
        yield
        
        # Cleanup
        logger.info("🛑 Shutting down Admin Service...")
        await mongodb_service.disconnect()
        logger.info("✅ MongoDB disconnected")
        
    except Exception as e:
        logger.error(f"❌ Error during startup: {str(e)}")
        raise

# Create FastAPI app
app = FastAPI(
    title="Lightweight Admin Service with RAG",
    description="Admin service with RAG using Pinecone and Gemini",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://theadwise.me",
        "http://localhost:8080",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://addwise.s3-website-ap-southeast-2.amazonaws.com",
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
    rag_engine_ready = bool(getattr(app.state, "rag_engine", None))
    pinecone_ready = bool(getattr(app.state, "pinecone_service", None))
    gemini_ready = bool(getattr(app.state, "gemini_service", None))
    rag_notes = getattr(app.state, "rag_disabled_reasons", [])
    
    return {
        "service": "Lightweight Admin Service with RAG",
        "version": "2.0.0",
        "status": "running",
        "features": {
            "rag": "Enabled" if rag_engine_ready else "Disabled",
            "llm": "Gemini 2.0 Flash" if gemini_ready else "Unavailable",
            "embeddings": "Gemini embedding-001" if gemini_ready else "Unavailable",
            "vector_db": "Pinecone" if pinecone_ready else "Unavailable",
            "database": "MongoDB",
            "chunk_size": settings.CHUNK_SIZE,
            "chunk_overlap": settings.CHUNK_OVERLAP
        },
        "rag_disabled_reasons": rag_notes,
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB
        db_service = getattr(app.state, "mongodb_service", None)
        db_status = await db_service.health_check() if db_service else False
        
        # Check Pinecone
        pinecone_service = getattr(app.state, "pinecone_service", None)
        pinecone_status = bool(pinecone_service) and pinecone_service.is_initialized()
        
        # Check Gemini
        gemini_service = getattr(app.state, "gemini_service", None)
        gemini_status = bool(gemini_service) and gemini_service.check_connection()
        
        rag_engine_ready = bool(getattr(app.state, "rag_engine", None))
        rag_notes = getattr(app.state, "rag_disabled_reasons", [])
        
        return {
            "status": "healthy" if db_status else "degraded",
            "database": "connected" if db_status else "disconnected",
            "vector_db": "initialized" if pinecone_status else "unavailable",
            "gemini": "connected" if gemini_status else "unavailable",
            "rag_engine": "ready" if rag_engine_ready else "disabled",
            "rag_disabled_reasons": rag_notes,
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
