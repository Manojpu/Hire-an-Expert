"""
Service for interacting with OpenAI API.
Handles embedding generation and RAG answer generation.
"""
import openai
from typing import List, Dict, Any
import sys
import os

# Add paths to find modules
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
sys.path.append(os.path.join(parent_dir, 'core'))
sys.path.append(os.path.join(parent_dir, 'utils'))

try:
    from core.config import settings
except ImportError:
    # Fallback configuration
    class FallbackSettings:
        OPENAI_API_KEY = "your-openai-api-key-here"
        EMBEDDING_MODEL = "text-embedding-3-small"
        CHAT_MODEL = "gpt-4o-mini"
        MAX_CONTEXT_LENGTH = 4000
    settings = FallbackSettings()

from utils.logger import get_logger

logger = get_logger(__name__)

class OpenAIService:
    """Handles all OpenAI API interactions"""
    
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a piece of text.
        
        Args:
            text: The text to embed
            
        Returns:
            List of 1536 float values representing the embedding
        """
        try:
            # Clean text and ensure it's not too long
            cleaned_text = text.strip()[:8000]  # OpenAI has limits
            
            response = await self.client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=cleaned_text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise
    
    async def generate_rag_answer(self, question: str, context_gigs: List[Dict[str, Any]]) -> str:
        """
        Generate an AI answer using gig information as context.
        
        Args:
            question: User's question
            context_gigs: List of relevant gigs with their details
            
        Returns:
            AI-generated answer as a string
        """
        try:
            # Build context from gigs
            context_parts = []
            for gig in context_gigs:
                gig_context = f"""
Gig: {gig.get('title', 'N/A')}
Category: {gig.get('category', 'N/A')}
Description: {gig.get('description', 'N/A')}
Expert: {gig.get('expert_name', 'N/A')}
Rating: {gig.get('rating', 'N/A')}/5
"""
                context_parts.append(gig_context)
            
            context = "\n".join(context_parts)
            
            # Truncate context if too long
            if len(context) > settings.MAX_CONTEXT_LENGTH:
                context = context[:settings.MAX_CONTEXT_LENGTH] + "...[truncated]"
            
            # System prompt - tells the AI how to behave
            system_prompt = """You are an AI assistant for an expert marketplace platform. 
Help users find the right experts based on their questions.

Guidelines:
1. Provide helpful answers based on the provided gig information
2. Recommend specific gigs that match the user's needs
3. Be concise but informative
4. Mention expert names and gig titles when making recommendations
"""

            # User prompt - the actual question with context
            user_prompt = f"""
Question: {question}

Available Expert Services:
{context}

Please provide a helpful answer and recommend relevant services.
"""

            response = await self.client.chat.completions.create(
                model=settings.CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating RAG answer: {str(e)}")
            raise

# Global instance - use this throughout the app
openai_service = OpenAIService()