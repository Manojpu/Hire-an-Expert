"""
Pydantic schemas for API requests and responses.
These define what data the API expects and returns.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Request schemas (what clients send to us)
class GigSearchRequest(BaseModel):
    """Request to search for similar gigs"""
    query: str = Field(..., min_length=1, max_length=1000, description="Search query")
    top_k: Optional[int] = Field(default=5, ge=1, le=20, description="Number of results to return")

class QuestionRequest(BaseModel):
    """Request to ask a question and get AI answer"""
    question: str = Field(..., min_length=1, max_length=2000, description="User's question")
    top_k: Optional[int] = Field(default=5, ge=1, le=10, description="Number of gigs to use for context")

class IndexGigRequest(BaseModel):
    """Request to index a gig"""
    gig_id: int
    force_update: Optional[bool] = Field(default=False, description="Update even if already exists")

# Response schemas (what we send back to clients)
class GigSearchResult(BaseModel):
    """Single gig search result"""
    gig_id: int
    similarity_score: float
    title: str = ""
    category: str = ""

class GigSearchResponse(BaseModel):
    """Complete search response"""
    results: List[GigSearchResult]
    query: str
    total_results: int
    execution_time_ms: float

class QuestionResponse(BaseModel):
    """AI-generated answer to a question"""
    answer: str  # The AI-generated answer
    relevant_gigs: List[GigSearchResult]  # Gigs that were used for context
    sources_used: int  # How many gigs were used to generate the answer

class IndexGigResponse(BaseModel):
    """Response after indexing a gig"""
    gig_id: int
    status: str  # "success", "error", or "exists"
    message: str
    embedding_created: bool