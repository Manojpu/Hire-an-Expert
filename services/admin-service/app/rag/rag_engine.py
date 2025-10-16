"""
RAG Engine
Orchestrates the complete RAG workflow: ingestion, retrieval, and generation
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

class RAGEngine:
    """Main RAG engine that orchestrates all components"""
    
    def __init__(self, vector_store, gemini_service, doc_processor, db):
        self.vector_store = vector_store
        self.gemini = gemini_service
        self.doc_processor = doc_processor
        self.db = db
    
    # ==================== Document Ingestion ====================
    
    async def ingest_file(
        self,
        file_path: str,
        source_type: str = "file",
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Ingest a file into the RAG system"""
        try:
            # Validate file
            if not self.doc_processor.validate_file(file_path):
                raise ValueError("Invalid file")
            
            # Extract file metadata
            file_metadata = self.doc_processor.extract_metadata(file_path)
            
            # Generate title from filename (remove extension)
            import os
            filename = file_metadata.get("filename", "Unknown")
            title = os.path.splitext(filename)[0]  # Remove extension for cleaner title
            
            # Store original file in GridFS (for PDFs and other files)
            file_id = None
            file_ext = file_metadata.get("file_type", "").lower()
            if file_ext in ['.pdf', '.docx', '.doc']:
                try:
                    file_id = await self.db.store_file(
                        file_path=file_path,
                        filename=filename,
                        metadata={
                            "document_type": source_type,
                            "content_type": self._get_content_type(file_ext)
                        }
                    )
                    logger.info(f"Original file stored in GridFS: {file_id}")
                except Exception as e:
                    logger.warning(f"Could not store file in GridFS: {str(e)}")
            
            # Store document in MongoDB
            document_data = {
                "title": additional_metadata.get("title") or title,  # Use provided title or generate from filename
                "source_type": source_type,
                "source_path": file_path,
                "file_id": file_id,  # GridFS file ID for viewing/downloading
                **file_metadata,
                **(additional_metadata or {})
            }
            
            document_id = await self.db.store_document(document_data)
            
            # Process file into chunks
            processed_chunks = self.doc_processor.process_file(
                file_path=file_path,
                document_id=document_id,
                metadata={
                    "document_id": document_id,
                    "source_type": source_type
                }
            )
            
            # Store chunks in MongoDB
            chunk_ids = await self.db.store_chunks(processed_chunks)
            
            # Extract texts and metadata for vector store
            texts = [chunk["text"] for chunk in processed_chunks]
            metadatas = [
                {
                    "document_id": document_id,
                    "chunk_id": chunk_id,
                    "chunk_index": chunk["chunk_index"],
                    **chunk["metadata"]
                }
                for chunk_id, chunk in zip(chunk_ids, processed_chunks)
            ]
            
            # Add to vector store
            vector_indices = self.vector_store.add_documents(texts, metadatas)
            
            logger.info(f"✅ Ingested document {document_id} with {len(texts)} chunks")
            
            return {
                "document_id": document_id,
                "filename": file_metadata.get("filename"),
                "chunks_created": len(texts),
                "vector_indices": vector_indices,
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error ingesting file: {str(e)}")
            raise
    
    async def ingest_text(
        self,
        text: str,
        title: str,
        source_type: str = "text",
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Ingest raw text into the RAG system"""
        try:
            # Store document in MongoDB
            document_data = {
                "title": title,
                "source_type": source_type,
                "content": text,
                "content_length": len(text),
                **(additional_metadata or {})
            }
            
            document_id = await self.db.store_document(document_data)
            
            # Process text into chunks
            processed_chunks = self.doc_processor.process_text(
                text=text,
                document_id=document_id,
                metadata={
                    "document_id": document_id,
                    "title": title,
                    "source_type": source_type
                }
            )
            
            # Store chunks in MongoDB
            chunk_ids = await self.db.store_chunks(processed_chunks)
            
            # Extract texts and metadata for vector store
            texts = [chunk["text"] for chunk in processed_chunks]
            metadatas = [
                {
                    "document_id": document_id,
                    "chunk_id": chunk_id,
                    "chunk_index": chunk["chunk_index"],
                    **chunk["metadata"]
                }
                for chunk_id, chunk in zip(chunk_ids, processed_chunks)
            ]
            
            # Add to vector store
            vector_indices = self.vector_store.add_documents(texts, metadatas)
            
            logger.info(f"✅ Ingested text document {document_id} with {len(texts)} chunks")
            
            return {
                "document_id": document_id,
                "title": title,
                "chunks_created": len(texts),
                "vector_indices": vector_indices,
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error ingesting text: {str(e)}")
            raise
    
    # ==================== Query and Retrieval ====================
    
    async def query(
        self,
        question: str,
        user_id: Optional[str] = None,
        top_k: int = None,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """Query the RAG system"""
        try:
            if top_k is None:
                top_k = settings.TOP_K_RESULTS
            
            # Search vector store for relevant chunks
            search_results = self.vector_store.search(question, k=top_k)
            
            if not search_results:
                response = self.gemini.generate_response(
                    prompt=question,
                    context=None
                )
                
                return {
                    "answer": response,
                    "sources": [],
                    "context_used": False,
                    "message": "No relevant context found. Answer based on general knowledge."
                }
            
            # Build context from retrieved chunks
            context_parts = []
            sources = []
            
            for result in search_results:
                context_parts.append(result["text"])
                sources.append({
                    "document_id": result.get("document_id"),
                    "chunk_index": result.get("chunk_index"),
                    "similarity": result.get("similarity"),
                    "text_preview": result["text"][:200] + "..."
                })
            
            context = "\n\n".join(context_parts)
            
            # Generate response using Gemini
            response = self.gemini.generate_response(
                prompt=question,
                context=context
            )
            
            # Store conversation in MongoDB
            if user_id:
                conversation_data = {
                    "user_id": user_id,
                    "question": question,
                    "answer": response,
                    "sources": sources,
                    "context_chunks": len(search_results)
                }
                await self.db.store_conversation(conversation_data)
            
            result = {
                "answer": response,
                "context_used": True,
                "num_sources": len(sources)
            }
            
            if include_sources:
                result["sources"] = sources
            
            return result
            
        except Exception as e:
            logger.error(f"Error querying RAG system: {str(e)}")
            raise
    
    async def query_streaming(
        self,
        question: str,
        user_id: Optional[str] = None,
        top_k: int = None
    ):
        """Query with streaming response"""
        try:
            if top_k is None:
                top_k = settings.TOP_K_RESULTS
            
            # Search for relevant chunks
            search_results = self.vector_store.search(question, k=top_k)
            
            # Build context
            context = None
            if search_results:
                context_parts = [result["text"] for result in search_results]
                context = "\n\n".join(context_parts)
            
            # Stream response
            for chunk in self.gemini.generate_streaming_response(
                prompt=question,
                context=context
            ):
                yield chunk
            
        except Exception as e:
            logger.error(f"Error in streaming query: {str(e)}")
            raise
    
    # ==================== Chat with Context ====================
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[str] = None,
        use_context: bool = True  # TRUE by default - use documents!
    ) -> Dict[str, Any]:
        """Fast chat WITH document context"""
        try:
            import asyncio
            from functools import partial
            
            # Get the last user message
            last_message = messages[-1]["content"]
            logger.info(f"💬 Chat: '{last_message[:50]}...'")
            
            # Check if it's a simple greeting (no context needed)
            simple_greetings = ['hi', 'hello', 'hey', 'sup', 'yo']
            is_greeting = last_message.lower().strip() in simple_greetings
            
            if is_greeting or not use_context:
                # Fast mode - no context
                logger.info("⚡ Fast mode (no context)")
                simple_msg = [{"role": "user", "content": last_message}]
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, self.gemini.chat, simple_msg)
                
                return {
                    "response": response,
                    "context_used": False
                }
            
            # WITH CONTEXT - for real questions
            logger.info("🔍 Searching documents...")
            search_results = self.vector_store.search(last_message, k=5)  # Get more results
            logger.info(f"📚 Found {len(search_results)} relevant chunks")
            
            if search_results:
                # Build concise context (OPTIMIZED & CLEANED)
                contexts = []
                for i, result in enumerate(search_results[:3], 1):  # Top 3 chunks
                    text = result["text"]  # USE FULL TEXT - don't truncate!
                    # Clean the text - remove special chars that might trigger safety
                    text = text.replace('\n', ' ').replace('\r', ' ').strip()
                    # Limit to reasonable size (2000 chars per chunk max)
                    if len(text) > 2000:
                        text = text[:2000] + "..."
                    contexts.append(f"[Source {i}] {text}")
                
                context = "\n\n".join(contexts)
                
                logger.info(f"📝 Context length: {len(context)} chars")
                logger.info("⚡ Calling Gemini WITH context...")
                
                # Use generate_response for clean, formatted answers
                loop = asyncio.get_event_loop()
                try:
                    response = await loop.run_in_executor(
                        None,
                        self.gemini.generate_response,
                        last_message,
                        context,
                        0.4,  # Slightly higher temperature for better formatting
                        400   # Enough tokens for complete answers
                    )
                    logger.info(f"✅ Response received ({len(response)} chars)")
                    
                    return {
                        "response": response,
                        "context_used": True,
                        "sources_count": len(search_results)
                    }
                except Exception as e:
                    logger.error(f"Error calling Gemini: {str(e)}")
                    # Fallback: Try one more time with simpler prompt
                    try:
                        simple_answer = await loop.run_in_executor(
                            None,
                            self.gemini.chat,
                            [{"role": "user", "content": f"Based on this information: {context[:1000]}\n\nQuestion: {last_message}\n\nProvide a clear, concise answer."}]
                        )
                        return {
                            "response": simple_answer,
                            "context_used": True,
                            "sources_count": len(search_results)
                        }
                    except:
                        # Last resort: concise excerpt
                        return {
                            "response": f"I found relevant information but had technical issues. Here's a brief excerpt: {search_results[0]['text'][:300]}... Please try rephrasing your question.",
                            "context_used": True,
                            "sources_count": len(search_results)
                        }
            else:
                # No relevant docs found
                logger.info("❌ No relevant documents found")
                simple_msg = [{"role": "user", "content": f"{last_message}\n\n(Note: No relevant documents found in knowledge base)"}]
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, self.gemini.chat, simple_msg)
                
                return {
                    "response": response,
                    "context_used": False
                }
            
        except Exception as e:
            import traceback
            logger.error(f"❌ Chat error: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Return a user-friendly error with the actual error in logs
            return {
                "response": f"I apologize, but I encountered an error: {str(e)}. Please check the logs for details.",
                "context_used": False,
                "error": str(e)
            }
    
    # ==================== Document Management ====================
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document from the RAG system"""
        try:
            # Delete from vector store
            self.vector_store.delete_by_document_id(document_id)
            
            # Get document to check if it has a file stored in GridFS
            document = await self.db.get_document(document_id)
            if document and document.get("file_id"):
                # Delete the file from GridFS
                await self.db.delete_file(document["file_id"])
                logger.info(f"Deleted file from GridFS: {document['file_id']}")
            
            # Delete from MongoDB
            success = await self.db.delete_document(document_id)
            
            if success:
                logger.info(f"✅ Deleted document {document_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            return False
    
    async def get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get document details"""
        return await self.db.get_document(document_id)
    
    async def list_documents(self, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        """List all documents"""
        return await self.db.get_all_documents(skip=skip, limit=limit)
    
    def _get_content_type(self, file_ext: str) -> str:
        """Get MIME content type for file extension"""
        content_types = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.txt': 'text/plain',
            '.md': 'text/markdown'
        }
        return content_types.get(file_ext.lower(), 'application/octet-stream')
    
    # ==================== Analytics ====================
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get RAG system statistics"""
        vector_stats = self.vector_store.get_stats()
        db_stats = await self.db.get_recent_activity()
        
        return {
            "vector_store": vector_stats,
            "database": db_stats,
            "system": {
                "embedding_model": settings.EMBEDDING_MODEL,
                "llm_model": settings.GEMINI_MODEL,
                "chunk_size": settings.CHUNK_SIZE,
                "top_k_default": settings.TOP_K_RESULTS
            }
        }
