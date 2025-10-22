"""
MongoDB Service for Document Storage
Handles document storage using MongoDB GridFS and metadata management
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
import certifi
from app.config import settings

logger = logging.getLogger(__name__)


class MongoDBService:
    """Service for MongoDB document storage and metadata"""
    
    def __init__(self):
        """Initialize MongoDB service"""
        self.client = None
        self.db = None
        self.fs_bucket = None
        self.documents_collection = None
        
        logger.info("MongoDBService initialized")
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            mongo_kwargs = {}
            if settings.MONGO_URI.startswith("mongodb+srv://") or "mongodb.net" in settings.MONGO_URI:
                # Atlas clusters require trusted CA bundle for TLS validation
                mongo_kwargs["tlsCAFile"] = certifi.where()

            self.client = AsyncIOMotorClient(settings.MONGO_URI, **mongo_kwargs)
            self.db = self.client[settings.MONGO_DB_NAME]
            
            # Initialize GridFS bucket for file storage
            self.fs_bucket = AsyncIOMotorGridFSBucket(self.db)
            
            # Collection for document metadata
            self.documents_collection = self.db['documents']
            
            # Test connection
            await self.client.admin.command('ping')
            
            logger.info(f"✅ Connected to MongoDB: {settings.MONGO_DB_NAME}")
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {str(e)}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def store_document(
        self, 
        filename: str, 
        file_content: bytes, 
        file_type: str,
        chunk_count: int,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Store document in MongoDB GridFS
        
        Args:
            filename: Original filename
            file_content: File content as bytes
            file_type: File type (pdf, txt)
            chunk_count: Number of chunks created
            metadata: Additional metadata
            
        Returns:
            Document ID
        """
        try:
            # Upload file to GridFS
            file_id = await self.fs_bucket.upload_from_stream(
                filename,
                file_content,
                metadata={
                    'file_type': file_type,
                    'upload_date': datetime.utcnow(),
                    'size': len(file_content)
                }
            )
            
            # Store document metadata
            doc_metadata = {
                'file_id': str(file_id),
                'filename': filename,
                'file_type': file_type,
                'chunk_count': chunk_count,
                'upload_date': datetime.utcnow(),
                'size': len(file_content),
                **(metadata or {})
            }
            
            result = await self.documents_collection.insert_one(doc_metadata)
            doc_id = str(result.inserted_id)
            
            logger.info(f"Stored document: {filename} with ID: {doc_id}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error storing document: {str(e)}")
            raise
    
    async def get_document(self, doc_id: str) -> Optional[Dict]:
        """
        Get document metadata by ID
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document metadata or None
        """
        try:
            result = await self.documents_collection.find_one({'_id': ObjectId(doc_id)})
            
            if result:
                result['_id'] = str(result['_id'])
                result['upload_date'] = result['upload_date'].isoformat()
                
            return result
            
        except Exception as e:
            logger.error(f"Error getting document: {str(e)}")
            return None
    
    async def get_document_file(self, file_id: str) -> Optional[bytes]:
        """
        Get document file content from GridFS
        
        Args:
            file_id: GridFS file ID
            
        Returns:
            File content as bytes or None
        """
        try:
            grid_out = await self.fs_bucket.open_download_stream(ObjectId(file_id))
            content = await grid_out.read()
            
            logger.info(f"Retrieved file content for ID: {file_id}")
            return content
            
        except Exception as e:
            logger.error(f"Error getting file content: {str(e)}")
            return None
    
    async def list_documents(
        self, 
        limit: int = 50, 
        skip: int = 0,
        filter_dict: Optional[Dict] = None
    ) -> List[Dict]:
        """
        List all documents with pagination
        
        Args:
            limit: Maximum number of documents to return
            skip: Number of documents to skip
            filter_dict: Optional filter criteria
            
        Returns:
            List of document metadata
        """
        try:
            query = filter_dict or {}
            
            logger.info(f"📋 Listing documents: limit={limit}, skip={skip}, filter={query}")
            
            cursor = self.documents_collection.find(query).skip(skip).limit(limit).sort('upload_date', -1)
            documents = await cursor.to_list(length=limit)
            
            logger.info(f"📊 Found {len(documents)} documents in MongoDB")
            
            # Format dates and IDs
            for doc in documents:
                doc['_id'] = str(doc['_id'])
                if 'upload_date' in doc and doc['upload_date']:
                    doc['upload_date'] = doc['upload_date'].isoformat()
            
            logger.info(f"✅ Returning {len(documents)} formatted documents")
            return documents
            
        except Exception as e:
            logger.error(f"❌ Error listing documents: {str(e)}", exc_info=True)
            return []
    
    async def delete_document(self, doc_id: str) -> bool:
        """
        Delete document and its file from storage
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if deleted successfully
        """
        try:
            # Get document metadata
            doc = await self.documents_collection.find_one({'_id': ObjectId(doc_id)})
            
            if not doc:
                logger.warning(f"Document not found: {doc_id}")
                return False
            
            # Delete file from GridFS
            file_id = doc.get('file_id')
            if file_id:
                await self.fs_bucket.delete(ObjectId(file_id))
            
            # Delete metadata
            await self.documents_collection.delete_one({'_id': ObjectId(doc_id)})
            
            logger.info(f"Deleted document: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            return False
    
    async def get_document_count(self, filter_dict: Optional[Dict] = None) -> int:
        """
        Get total document count
        
        Args:
            filter_dict: Optional filter criteria
            
        Returns:
            Document count
        """
        try:
            query = filter_dict or {}
            count = await self.documents_collection.count_documents(query)
            return count
            
        except Exception as e:
            logger.error(f"Error getting document count: {str(e)}")
            return 0
    
    async def health_check(self) -> bool:
        """Check if MongoDB is connected"""
        try:
            await self.client.admin.command('ping')
            return True
        except:
            return False
