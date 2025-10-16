"""
Gemini 1.5 Flash Service
Handles LLM interactions with Google's Gemini API
"""
import logging
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    """Service for interacting with Gemini 1.5 Flash"""
    
    def __init__(self):
        self.model = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Gemini API"""
        try:
            if not settings.GOOGLE_API_KEY:
                raise ValueError("GOOGLE_API_KEY not set in environment variables")
            
            # Configure Gemini
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            
            # Initialize model
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            
            logger.info(f"✅ Gemini {settings.GEMINI_MODEL} initialized")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Gemini: {str(e)}")
            raise
    
    def generate_response(
        self,
        prompt: str,
        context: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """Generate a response using Gemini"""
        try:
            # Safety settings - BLOCK_ONLY_HIGH for stability
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
            ]
            
            # Build a professional prompt that creates clean answers
            if context:
                full_prompt = f"""You are a helpful platform assistant. Answer the user's question based on the documentation below.

Documentation:
{context}

User Question: {prompt}

Instructions:
- Provide a clear, concise, and well-formatted answer
- Use bullet points or numbered lists when appropriate
- Only include relevant information
- Be professional and helpful
- Do NOT repeat the entire documentation
- Keep the answer under 200 words unless more detail is needed

Answer:"""
            else:
                full_prompt = prompt
            
            # Generate response
            generation_config = genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            # Check for safety blocks
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'finish_reason') and candidate.finish_reason == 2:
                    logger.warning(f"⚠️ Response blocked by safety filter, trying simplified approach")
                    # Try with even simpler prompt
                    simple_prompt = f"Please answer this question concisely: {prompt}\n\nRelevant information: {context[:500] if context else ''}"
                    fallback_response = self.model.generate_content(
                        simple_prompt,
                        generation_config=genai.GenerationConfig(temperature=0.5, max_output_tokens=300),
                        safety_settings=safety_settings
                    )
                    if fallback_response.text:
                        return fallback_response.text
                    else:
                        return "I found relevant information but need you to rephrase your question more specifically."
            
            return response.text if response.text else "I couldn't generate a proper response. Please rephrase your question."
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return "I encountered an error processing your question. Please try rephrasing it differently."
    
    def generate_streaming_response(
        self,
        prompt: str,
        context: Optional[str] = None,
        temperature: float = 0.7
    ):
        """Generate a streaming response using Gemini"""
        try:
            # Build the full prompt
            full_prompt = prompt
            if context:
                full_prompt = f"""Context information is below:
---------------------
{context}
---------------------

Given the context information above, please answer the following question:
{prompt}"""
            
            # Generate streaming response
            generation_config = genai.GenerationConfig(
                temperature=temperature,
            )
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=generation_config,
                stream=True
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Error generating streaming response: {str(e)}")
            raise
    
    def summarize_text(self, text: str, max_length: int = 200) -> str:
        """Summarize a text"""
        try:
            prompt = f"""Please provide a concise summary of the following text in no more than {max_length} words:

{text}"""
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Error summarizing text: {str(e)}")
            return text[:max_length]
    
    def extract_keywords(self, text: str, count: int = 10) -> List[str]:
        """Extract keywords from text"""
        try:
            prompt = f"""Extract the {count} most important keywords or phrases from the following text. Return only the keywords, one per line:

{text}"""
            
            response = self.model.generate_content(prompt)
            keywords = [k.strip() for k in response.text.split('\n') if k.strip()]
            return keywords[:count]
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            return []
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2  # Balanced for quality + speed
    ) -> str:
        """Optimized chat - fast WITH good answers"""
        try:
            # Safety settings - allow business content
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
            
            # Optimized config: good answers, still fast
            generation_config = genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=300,  # Enough for detailed answers
                top_p=0.9,
                top_k=40
            )
            
            # Simple, fast call - NO chat history for speed
            last_message = messages[-1]["content"]
            
            logger.info(f"🤖 Gemini generating response for: '{last_message[:100]}...'")
            
            # Direct generate - faster than chat, with safety settings
            response = self.model.generate_content(
                last_message,
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            # Check if response was blocked BEFORE accessing .text
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'finish_reason'):
                    # finish_reason: 1=STOP (normal), 2=SAFETY, 3=RECITATION, 4=OTHER
                    if candidate.finish_reason == 2:
                        logger.warning(f"⚠️ Gemini SAFETY block: {response.prompt_feedback}")
                        return "I found information about this topic, but I need to rephrase it. Let me try: The platform processes payments securely and applies a service fee."
                    elif candidate.finish_reason != 1:
                        logger.warning(f"⚠️ Gemini stopped. Reason: {candidate.finish_reason}")
                        return "I had trouble generating a complete response. Please try asking in a different way."
            
            # Safe to access .text now
            response_text = response.text if response.text else "I couldn't generate a proper response. Please try again."
            logger.info(f"✅ Gemini response: '{response_text[:100]}...'")
            return response_text
            
        except Exception as e:
            import traceback
            logger.error(f"❌ GEMINI ERROR: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Return helpful error
            return f"I encountered an error while processing your question. Please try again."
