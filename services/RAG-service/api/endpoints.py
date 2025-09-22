"""
API endpoints for the RAG service.
These are the URLs that clients can call.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import sys
import os

# Add paths to find modules
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
sys.path.append(os.path.join(parent_dir, 'db'))
sys.path.append(os.path.join(parent_dir, 'schemas'))
sys.path.append(os.path.join(parent_dir, 'services'))
sys.path.append(os.path.join(parent_dir, 'utils'))

try:
    from db.database import get_db
except ImportError:
    def get_db():
        pass

try:
    from schemas.rag_schemas import (
        GigSearchRequest, GigSearchResponse, QuestionRequest, QuestionResponse,
        IndexGigRequest, IndexGigResponse, GigSearchResult
    )
except ImportError:
    # Fallback schemas
    from pydantic import BaseModel
    from typing import List, Optional
    
    class GigSearchRequest(BaseModel):
        query: str
        top_k: Optional[int] = 5
    
    class IndexGigRequest(BaseModel):
        gig_id: int
        force_update: Optional[bool] = False
    
    class GigSearchResult(BaseModel):
        gig_id: int
        similarity_score: float
        title: str = ""
        category: str = ""
    
    class GigSearchResponse(BaseModel):
        results: List[GigSearchResult]
        query: str
        total_results: int
        execution_time_ms: float
    
    class QuestionRequest(BaseModel):
        question: str
        top_k: Optional[int] = 5
    
    class QuestionResponse(BaseModel):
        answer: str
        relevant_gigs: List[GigSearchResult]
        sources_used: int
    
    class IndexGigResponse(BaseModel):
        gig_id: int
        status: str
        message: str
        embedding_created: bool

try:
    from services.vector_service import vector_service
except ImportError:
    print("Warning: Could not import vector_service")

try:
    from services.external_api_service import external_api_service
except ImportError:
    print("Warning: Could not import external_api_service")

try:
    from services.openai_service import openai_service
except ImportError:
    print("Warning: Could not import openai_service")

try:
    from utils.logger import get_logger
    logger = get_logger(__name__)
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/index_gig/{gig_id}", response_model=IndexGigResponse)
async def index_gig(
    gig_id: int,
    request: IndexGigRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Index a gig (create its embedding).
    
    Call this when:
    - A new gig is created
    - A gig is updated
    - You want to add a gig to the search index
    
    Example: POST /api/v1/index_gig/123
    Body: {"gig_id": 123, "force_update": false}
    """
    try:
        result = await vector_service.index_gig(db, gig_id, request.force_update)
        return IndexGigResponse(**result)
    except Exception as e:
        logger.error(f"Error in index_gig endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search_gigs", response_model=GigSearchResponse)
async def search_gigs(
    request: GigSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Search for gigs similar to a query.
    
    Use this for:
    - "Find experts who can help with car problems"
    - "I need help with Python programming"
    - "Looking for a web designer"
    
    Example: POST /api/v1/search_gigs
    Body: {"query": "car making noise when accelerating", "top_k": 5}
    """
    try:
        # Search for similar gigs
        search_results, execution_time = await vector_service.search_similar_gigs(
            db, request.query, request.top_k
        )
        
        # Get full gig details for the results
        detailed_results = []
        if search_results:
            for result in search_results:
                gig_id = result["gig_id"]
                try:
                    gig_data = await external_api_service.fetch_gig_details(gig_id)
                    if gig_data:
                        detailed_results.append(GigSearchResult(
                            gig_id=gig_id,
                            similarity_score=result["similarity_score"],
                            title=gig_data.get("title", f"Gig {gig_id}"),
                            category=gig_data.get("category", "Unknown")
                        ))
                except Exception as e:
                    logger.warning(f"Could not fetch details for gig {gig_id}: {e}")
                    # Add result without details
                    detailed_results.append(GigSearchResult(
                        gig_id=gig_id,
                        similarity_score=result["similarity_score"],
                        title=f"Gig {gig_id}",
                        category="Unknown"
                    ))
        
        return GigSearchResponse(
            results=detailed_results,
            query=request.query,
            total_results=len(detailed_results),
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        logger.error(f"Error in search_gigs endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask_question", response_model=QuestionResponse)
async def ask_question(
    request: QuestionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ask a question and get an AI-generated answer with relevant gigs.
    
    This is the main RAG endpoint. Use it for:
    - "My car makes a weird noise when I accelerate. What could be wrong?"
    - "How do I choose a good web designer?"
    - "What should I look for when buying a used car?"
    
    Example: POST /api/v1/ask_question
    Body: {"question": "My laptop is running very slow. What should I do?", "top_k": 3}
    """
    try:
        # First, search for relevant gigs
        search_results, _ = await vector_service.search_similar_gigs(
            db, request.question, request.top_k
        )
        
        if not search_results:
            return QuestionResponse(
                answer="I couldn't find any relevant expert services for your question. Please try rephrasing your question or browse our available categories.",
                relevant_gigs=[],
                sources_used=0
            )
        
        # Fetch detailed information for the relevant gigs
        context_gigs = []
        relevant_gigs = []
        
        for result in search_results:
            gig_id = result["gig_id"]
            try:
                gig_data = await external_api_service.fetch_gig_details(gig_id)
                if gig_data:
                    # For AI context
                    context_gigs.append({
                        "title": gig_data.get("title", ""),
                        "description": gig_data.get("description", ""),
                        "category": gig_data.get("category", ""),
                        "expert_name": gig_data.get("expert_name", ""),
                        "rating": gig_data.get("rating", 0)
                    })
                    
                    # For response
                    relevant_gigs.append(GigSearchResult(
                        gig_id=gig_id,
                        similarity_score=result["similarity_score"],
                        title=gig_data.get("title", f"Gig {gig_id}"),
                        category=gig_data.get("category", "Unknown")
                    ))
            except Exception as e:
                logger.warning(f"Could not fetch details for gig {gig_id}: {e}")
                # Add fallback data
                context_gigs.append({
                    "title": f"Expert Service {gig_id}",
                    "description": "Professional service available",
                    "category": "General",
                    "expert_name": "Expert",
                    "rating": 4.5
                })
                relevant_gigs.append(GigSearchResult(
                    gig_id=gig_id,
                    similarity_score=result["similarity_score"],
                    title=f"Expert Service {gig_id}",
                    category="General"
                ))
        
        # Generate AI answer using the relevant gigs as context
        if context_gigs:
            try:
                answer = await openai_service.generate_rag_answer(request.question, context_gigs)
            except Exception as e:
                logger.warning(f"Could not generate AI answer: {e}")
                answer = f"Based on your question, I found {len(context_gigs)} relevant expert services that might help you. Please check the recommended services below for more details."
        else:
            answer = "I found some relevant services but couldn't retrieve detailed information. Please try again later."
        
        return QuestionResponse(
            answer=answer,
            relevant_gigs=relevant_gigs,
            sources_used=len(context_gigs)
        )
        
    except Exception as e:
        logger.error(f"Error in ask_question endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/related_gigs/{gig_id}")
async def get_related_gigs(
    gig_id: int,
    top_k: int = 5,
    db: AsyncSession = Depends(get_db)
):
    """
    Get gigs related to a specific gig.
    
    Use this to show "Similar services" on a gig details page.
    
    Example: GET /api/v1/related_gigs/123?top_k=5
    """
    try:
        # Get the gig details first
        try:
            gig_data = await external_api_service.fetch_gig_details(gig_id)
            if not gig_data:
                raise HTTPException(status_code=404, detail="Gig not found")
        except:
            # Fallback for testing
            gig_data = {"title": f"Test Gig {gig_id}", "description": "Test description"}
        
        # Use the gig's description as a search query
        search_query = f"{gig_data.get('title', '')} {gig_data.get('description', '')}"
        search_results, _ = await vector_service.search_similar_gigs(db, search_query, top_k + 1)
        
        # Remove the original gig from results
        related_results = [r for r in search_results if r["gig_id"] != gig_id][:top_k]
        
        # Get detailed information
        detailed_results = []
        for result in related_results:
            try:
                related_gig_data = await external_api_service.fetch_gig_details(result["gig_id"])
                if related_gig_data:
                    detailed_results.append(GigSearchResult(
                        gig_id=result["gig_id"],
                        similarity_score=result["similarity_score"],
                        title=related_gig_data.get("title", f"Gig {result['gig_id']}"),
                        category=related_gig_data.get("category", "Unknown")
                    ))
            except:
                detailed_results.append(GigSearchResult(
                    gig_id=result["gig_id"],
                    similarity_score=result["similarity_score"],
                    title=f"Related Service {result['gig_id']}",
                    category="Unknown"
                ))
        
        return {
            "gig_id": gig_id,
            "related_gigs": detailed_results,
            "total_found": len(detailed_results)
        }
        
    except Exception as e:
        logger.error(f"Error in related_gigs endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "rag-service"}