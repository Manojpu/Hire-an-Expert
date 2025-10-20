"""
Document Processor for RAG System
Handles PDF and TXT file processing with word-based chunking
"""
import logging
from typing import List, Dict
from pypdf import PdfReader
import io

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Process documents and split into chunks"""
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        """
        Initialize document processor
        
        Args:
            chunk_size: Number of words per chunk
            chunk_overlap: Number of words to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        logger.info(f"DocumentProcessor initialized with chunk_size={chunk_size}, overlap={chunk_overlap}")
    
    def chunk_by_words(self, text: str) -> List[str]:
        """
        Split text into chunks by words with overlap
        
        Args:
            text: Text to chunk
            
        Returns:
            List of text chunks
        """
        words = text.split()
        chunks = []
        
        if len(words) == 0:
            return []
        
        # Calculate step size (chunk_size - overlap)
        step_size = self.chunk_size - self.chunk_overlap
        
        for i in range(0, len(words), step_size):
            chunk = " ".join(words[i:i + self.chunk_size])
            chunks.append(chunk)
            
            # Break if we've processed all words
            if i + self.chunk_size >= len(words):
                break
        
        logger.info(f"Split text into {len(chunks)} chunks")
        return chunks
    
    def process_pdf(self, file_content: bytes) -> Dict[str, any]:
        """
        Extract text from PDF and chunk it
        
        Args:
            file_content: PDF file content as bytes
            
        Returns:
            Dict with extracted text and chunks
        """
        try:
            # Read PDF from bytes
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            
            # Extract text from all pages
            texts = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text.strip():
                    texts.append({
                        'page_number': i + 1,
                        'text': page_text
                    })
            
            # Combine all text
            full_text = " ".join([t['text'] for t in texts])
            
            # Create chunks
            chunks = self.chunk_by_words(full_text)
            
            logger.info(f"Processed PDF: {len(reader.pages)} pages, {len(chunks)} chunks")
            
            return {
                'full_text': full_text,
                'chunks': chunks,
                'page_count': len(reader.pages),
                'chunk_count': len(chunks)
            }
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            raise ValueError(f"Failed to process PDF: {str(e)}")
    
    def process_txt(self, file_content: bytes) -> Dict[str, any]:
        """
        Process TXT file and chunk it
        
        Args:
            file_content: TXT file content as bytes
            
        Returns:
            Dict with text and chunks
        """
        try:
            # Decode text content
            text = file_content.decode('utf-8')
            
            # Create chunks
            chunks = self.chunk_by_words(text)
            
            logger.info(f"Processed TXT: {len(chunks)} chunks")
            
            return {
                'full_text': text,
                'chunks': chunks,
                'chunk_count': len(chunks)
            }
            
        except Exception as e:
            logger.error(f"Error processing TXT: {str(e)}")
            raise ValueError(f"Failed to process TXT: {str(e)}")
    
    def process_document(self, file_content: bytes, filename: str) -> Dict[str, any]:
        """
        Process document based on file type
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            
        Returns:
            Dict with processing results
        """
        file_ext = filename.lower().split('.')[-1]
        
        if file_ext == 'pdf':
            return self.process_pdf(file_content)
        elif file_ext == 'txt':
            return self.process_txt(file_content)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}. Only PDF and TXT are supported.")
