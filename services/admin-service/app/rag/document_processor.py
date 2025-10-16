"""
Document Processor
Handles document loading, parsing, and chunking using LangChain
"""
import os
import logging
from typing import List, Dict, Any, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
import re

# Document loaders
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredWordDocumentLoader,
)

# PDF metadata extraction
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None  # Fallback if pypdf not available

from app.config import settings

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Process and chunk documents"""
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    def load_file(self, file_path: str) -> List[Document]:
        """Load a document from file"""
        try:
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if file_ext == '.pdf':
                loader = PyPDFLoader(file_path)
            elif file_ext == '.txt' or file_ext == '.md':
                loader = TextLoader(file_path)
            elif file_ext in ['.doc', '.docx']:
                loader = UnstructuredWordDocumentLoader(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            documents = loader.load()
            logger.info(f"Loaded {len(documents)} pages from {file_path}")
            return documents
            
        except Exception as e:
            logger.error(f"Error loading file: {str(e)}")
            raise
    
    def load_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Document]:
        """Load text directly"""
        if metadata is None:
            metadata = {}
        
        doc = Document(page_content=text, metadata=metadata)
        return [doc]
    
    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks"""
        try:
            chunks = self.text_splitter.split_documents(documents)
            logger.info(f"Split into {len(chunks)} chunks")
            return chunks
        except Exception as e:
            logger.error(f"Error chunking documents: {str(e)}")
            raise
    
    def chunk_text(self, text: str) -> List[str]:
        """Split text into chunks"""
        try:
            chunks = self.text_splitter.split_text(text)
            return chunks
        except Exception as e:
            logger.error(f"Error chunking text: {str(e)}")
            raise
    
    def process_file(
        self,
        file_path: str,
        document_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Process a file completely: load, chunk, and prepare for storage"""
        try:
            # Load documents
            documents = self.load_file(file_path)
            
            # Add metadata
            if metadata:
                for doc in documents:
                    doc.metadata.update(metadata)
            
            # Chunk documents
            chunks = self.chunk_documents(documents)
            
            # Prepare chunks for storage
            processed_chunks = []
            for i, chunk in enumerate(chunks):
                processed_chunk = {
                    "document_id": document_id,
                    "chunk_index": i,
                    "text": chunk.page_content,
                    "metadata": {
                        **chunk.metadata,
                        "chunk_id": f"{document_id}_chunk_{i}"
                    }
                }
                processed_chunks.append(processed_chunk)
            
            logger.info(f"Processed {len(processed_chunks)} chunks for document {document_id}")
            return processed_chunks
            
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}")
            raise
    
    def process_text(
        self,
        text: str,
        document_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Process text: chunk and prepare for storage"""
        try:
            # Chunk text
            chunks = self.chunk_text(text)
            
            # Prepare chunks for storage
            processed_chunks = []
            for i, chunk_text in enumerate(chunks):
                processed_chunk = {
                    "document_id": document_id,
                    "chunk_index": i,
                    "text": chunk_text,
                    "metadata": {
                        **(metadata or {}),
                        "chunk_id": f"{document_id}_chunk_{i}"
                    }
                }
                processed_chunks.append(processed_chunk)
            
            logger.info(f"Processed {len(processed_chunks)} chunks from text")
            return processed_chunks
            
        except Exception as e:
            logger.error(f"Error processing text: {str(e)}")
            raise
    
    def extract_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract metadata from a file"""
        try:
            file_stat = os.stat(file_path)
            file_name = os.path.basename(file_path)
            file_ext = os.path.splitext(file_path)[1].lower()
            
            metadata = {
                "filename": file_name,
                "file_type": file_ext,
                "file_size": file_stat.st_size,
                "file_path": file_path,
            }
            
            # Extract PDF-specific metadata
            if file_ext == '.pdf':
                try:
                    if PdfReader:  # Check if pypdf is available
                        reader = PdfReader(file_path)
                        
                        # Get PDF info
                        pdf_info = reader.metadata if reader.metadata else {}
                        metadata["page_count"] = len(reader.pages)
                        
                        # Extract PDF metadata if available
                        if pdf_info:
                            metadata["pdf_title"] = pdf_info.get("/Title", "")
                            metadata["pdf_author"] = pdf_info.get("/Author", "")
                            metadata["pdf_subject"] = pdf_info.get("/Subject", "")
                            metadata["pdf_creator"] = pdf_info.get("/Creator", "")
                        
                except Exception as pdf_error:
                    logger.warning(f"Could not extract PDF metadata: {str(pdf_error)}")
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting metadata: {str(e)}")
            return {}
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:\-\(\)]', '', text)
        
        return text.strip()
    
    def validate_file(self, file_path: str) -> bool:
        """Validate if file can be processed"""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                return False
            
            # Check file extension
            file_ext = os.path.splitext(file_path)[1].lower()
            if file_ext not in settings.ALLOWED_EXTENSIONS:
                return False
            
            # Check file size
            file_size = os.path.getsize(file_path)
            if file_size > settings.MAX_UPLOAD_SIZE:
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating file: {str(e)}")
            return False
