"""
Database models for the RAG service.
These represent the tables in PostgreSQL.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Index, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
import sys
import os

# Add path to find database module
sys.path.append(os.path.dirname(__file__))
from database import Base

# Try to import pgvector, fallback to JSON if not available
try:
    from pgvector.sqlalchemy import Vector
    VECTOR_AVAILABLE = True
    def VectorColumn(dim):
        return Vector(dim)
except ImportError:
    # Fallback for development/testing without pgvector
    VECTOR_AVAILABLE = False
    def VectorColumn(dim):
        return JSON
    print("Warning: pgvector not available, using JSON as fallback")

class GigEmbedding(Base):
    """
    Stores embeddings for gigs.
    Each row represents one gig with its text content and vector embedding.
    """
    __tablename__ = "gig_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    gig_id = Column(Integer, unique=True, index=True, nullable=False)  # Reference to gig in gig service
    combined_text = Column(Text, nullable=False)  # Gig info + reviews combined
    embedding = Column(VectorColumn(1536), nullable=False)  # OpenAI embedding (1536 dimensions)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class QueryLog(Base):
    """
    Logs user queries for analytics.
    Helps understand what users are searching for.
    """
    __tablename__ = "query_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(Text, nullable=False)  # What the user searched for
    query_embedding = Column(VectorColumn(1536))  # Embedding of the query
    top_gig_ids = Column(ARRAY(Integer))  # Which gigs were returned
    similarity_scores = Column(ARRAY(Float))  # How similar they were
    response_time_ms = Column(Float)  # How long the search took
    created_at = Column(DateTime(timezone=True), server_default=func.now())