"""
MongoDB Database Handler
Stores raw documents, metadata, and conversation history
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    """MongoDB database handler"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.fs: Optional[AsyncIOMotorGridFSBucket] = None  # GridFS for file storage
        
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGO_URI)
            self.db = self.client[settings.MONGO_DB_NAME]
            self.fs = AsyncIOMotorGridFSBucket(self.db)  # Initialize GridFS
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"✅ Connected to MongoDB: {settings.MONGO_DB_NAME}")
            
            # Create indexes
            await self._create_indexes()
            
        except Exception as e:
            logger.error(f"❌ MongoDB connection error: {str(e)}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    async def health_check(self) -> bool:
        """Check if MongoDB is connected"""
        try:
            await self.client.admin.command('ping')
            return True
        except:
            return False
    
    async def _create_indexes(self):
        """Create database indexes"""
        # Documents collection indexes
        await self.db.documents.create_index("document_id")
        await self.db.documents.create_index("created_at")
        await self.db.documents.create_index("source_type")
        
        # Conversations collection indexes
        await self.db.conversations.create_index("user_id")
        await self.db.conversations.create_index("created_at")
        
        # Chunks collection indexes
        await self.db.chunks.create_index("document_id")
        await self.db.chunks.create_index("chunk_index")
        
        logger.info("✅ Database indexes created")
    
    # ==================== Document Operations ====================
    
    async def store_document(self, document_data: Dict[str, Any]) -> str:
        """Store a document in MongoDB"""
        document_data["created_at"] = datetime.utcnow()
        document_data["updated_at"] = datetime.utcnow()
        
        result = await self.db.documents.insert_one(document_data)
        logger.info(f"Document stored with ID: {result.inserted_id}")
        return str(result.inserted_id)
    
    async def get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID"""
        try:
            doc = await self.db.documents.find_one({"_id": ObjectId(document_id)})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception as e:
            logger.error(f"Error getting document: {str(e)}")
            return None
    
    async def get_all_documents(self, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all documents with pagination"""
        cursor = self.db.documents.find().sort("created_at", -1).skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        
        for doc in documents:
            doc["_id"] = str(doc["_id"])
        
        return documents
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document"""
        try:
            result = await self.db.documents.delete_one({"_id": ObjectId(document_id)})
            
            # Also delete associated chunks
            await self.db.chunks.delete_many({"document_id": document_id})
            
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            return False
    
    # ==================== Chunk Operations ====================
    
    async def store_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Store document chunks"""
        for chunk in chunks:
            chunk["created_at"] = datetime.utcnow()
        
        result = await self.db.chunks.insert_many(chunks)
        return [str(id) for id in result.inserted_ids]
    
    async def get_chunks_by_document(self, document_id: str) -> List[Dict[str, Any]]:
        """Get all chunks for a document"""
        cursor = self.db.chunks.find({"document_id": document_id}).sort("chunk_index", 1)
        chunks = await cursor.to_list(length=None)
        
        for chunk in chunks:
            chunk["_id"] = str(chunk["_id"])
        
        return chunks
    
    async def get_chunk_by_id(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific chunk"""
        try:
            chunk = await self.db.chunks.find_one({"_id": ObjectId(chunk_id)})
            if chunk:
                chunk["_id"] = str(chunk["_id"])
            return chunk
        except Exception as e:
            logger.error(f"Error getting chunk: {str(e)}")
            return None
    
    # ==================== Conversation Operations ====================
    
    async def store_conversation(self, conversation_data: Dict[str, Any]) -> str:
        """Store a RAG conversation"""
        conversation_data["created_at"] = datetime.utcnow()
        conversation_data["updated_at"] = datetime.utcnow()
        
        result = await self.db.conversations.insert_one(conversation_data)
        return str(result.inserted_id)
    
    async def get_conversation_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get conversation history for a user"""
        cursor = self.db.conversations.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)
        
        conversations = await cursor.to_list(length=limit)
        
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
        
        return conversations
    
    async def update_conversation(self, conversation_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a conversation"""
        try:
            update_data["updated_at"] = datetime.utcnow()
            result = await self.db.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating conversation: {str(e)}")
            return False
    
    # ==================== GridFS File Storage Operations ====================
    
    async def store_file(self, file_path: str, filename: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Store a file in GridFS"""
        try:
            with open(file_path, 'rb') as f:
                file_id = await self.fs.upload_from_stream(
                    filename,
                    f,
                    metadata=metadata or {}
                )
            logger.info(f"File stored in GridFS: {filename} (ID: {file_id})")
            return str(file_id)
        except Exception as e:
            logger.error(f"Error storing file in GridFS: {str(e)}")
            raise
    
    async def get_file(self, file_id: str):
        """Retrieve a file from GridFS"""
        try:
            grid_out = await self.fs.open_download_stream(ObjectId(file_id))
            return grid_out
        except Exception as e:
            logger.error(f"Error retrieving file from GridFS: {str(e)}")
            raise
    
    async def get_file_data(self, file_id: str) -> bytes:
        """Get file data as bytes"""
        try:
            grid_out = await self.fs.open_download_stream(ObjectId(file_id))
            return await grid_out.read()
        except Exception as e:
            logger.error(f"Error reading file from GridFS: {str(e)}")
            raise
    
    async def delete_file(self, file_id: str) -> bool:
        """Delete a file from GridFS"""
        try:
            await self.fs.delete(ObjectId(file_id))
            logger.info(f"File deleted from GridFS: {file_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting file from GridFS: {str(e)}")
            return False
    
    # ==================== Analytics Operations ====================
    
    async def get_document_count(self) -> int:
        """Get total document count"""
        return await self.db.documents.count_documents({})
    
    async def get_conversation_count(self) -> int:
        """Get total conversation count"""
        return await self.db.conversations.count_documents({})
    
    async def get_recent_activity(self, limit: int = 20) -> Dict[str, Any]:
        """Get recent activity stats"""
        recent_docs = await self.db.documents.find().sort("created_at", -1).limit(limit).to_list(length=limit)
        recent_convs = await self.db.conversations.find().sort("created_at", -1).limit(limit).to_list(length=limit)
        
        return {
            "recent_documents": len(recent_docs),
            "recent_conversations": len(recent_convs),
            "total_documents": await self.get_document_count(),
            "total_conversations": await self.get_conversation_count()
        }
