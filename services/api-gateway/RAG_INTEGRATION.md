# RAG API Gateway Integration

## Overview
The RAG (Retrieval-Augmented Generation) system is now integrated with the API Gateway, providing a centralized routing point for all AI chat functionality.

## Architecture

```
Frontend (React)
    ↓
API Gateway (Port 8000)
    ↓
Admin Service / RAG System (Port 8009)
    ↓
├── Gemini 2.5 Flash (AI)
├── FAISS (Vector Store)
└── MongoDB Atlas (Document Storage)
```

## Endpoints

All RAG endpoints are now accessible through the API Gateway:

### Base URL
- **Direct (Old):** `http://localhost:8009/api/rag` ❌
- **Through Gateway (New):** `http://localhost:8000/api/rag` ✅

### Available Endpoints

#### 1. Health Check
```bash
GET http://localhost:8000/api/rag/health
```
**Response:**
```json
{
  "status": "healthy",
  "rag_engine": "ready",
  "database": "connected",
  "vector_store": "initialized"
}
```

#### 2. Query (Single Question)
```bash
POST http://localhost:8000/api/rag/query
Content-Type: application/json

{
  "question": "What is FastAPI?",
  "include_sources": true,
  "top_k": 5
}
```
**Response:**
```json
{
  "status": "success",
  "answer": "FastAPI is a modern web framework...",
  "sources": [...]
}
```

#### 3. Chat (Conversational)
```bash
POST http://localhost:8000/api/rag/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "use_context": true
}
```
**Response:**
```json
{
  "status": "success",
  "response": "Hello! How can I help you today?",
  "context_used": true
}
```

#### 4. Upload Document (Admin Only)
```bash
POST http://localhost:8000/api/rag/ingest/file
Content-Type: multipart/form-data

file: <PDF/TXT/DOCX file>
```

#### 5. Upload Text (Admin Only)
```bash
POST http://localhost:8000/api/rag/ingest/text
Content-Type: application/json

{
  "text": "Your content here...",
  "title": "Document Title",
  "metadata": {}
}
```

#### 6. List Documents
```bash
GET http://localhost:8000/api/rag/documents
```
**Response:**
```json
{
  "status": "success",
  "documents": [...],
  "total_chunks": 4
}
```

## Configuration

### API Gateway (.env)
```env
# Service URLs
ADMIN_SERVICE_URL=http://localhost:8009
```

### Frontend (aiChatService.ts)
```typescript
const RAG_API_BASE = 'http://localhost:8000/api/rag';
```

## Files Modified

1. **services/api-gateway/main.py**
   - Added `ADMIN_SERVICE_URL` to Config
   - Added `"admin"` to services mapping
   - Created `proxy_rag()` handler
   - Added route: `/api/rag/{path:path}`

2. **services/api-gateway/.env**
   - Added: `ADMIN_SERVICE_URL=http://localhost:8009`

3. **frontend/src/services/aiChatService.ts**
   - Changed: `RAG_API_BASE = 'http://localhost:8000/api/rag'`

## Testing

### Start Services
```bash
# Terminal 1: Start Admin Service (RAG)
cd services/admin-service
.\start.bat

# Terminal 2: Start API Gateway
cd services/api-gateway
.\start.bat

# Terminal 3: Run tests
cd services/api-gateway
python test_rag_routes.py
```

### Test Script
The test script (`test_rag_routes.py`) validates:
- ✅ Gateway health check
- ✅ RAG health through gateway
- ✅ Query functionality
- ✅ Chat functionality
- ✅ Document listing

## Benefits

### 1. Centralized Routing
- All API requests go through port 8000
- Easier to manage and monitor

### 2. Security
- Can add authentication middleware
- Rate limiting at gateway level
- Single point for security policies

### 3. Production Ready
- Easy to scale services independently
- Load balancing support
- Service discovery ready

### 4. Consistency
- Uniform API structure: `/api/{service}/{endpoint}`
- Standardized error handling
- Centralized logging

## Frontend Usage

### Import Service
```typescript
import { aiChatService } from '@/services/aiChatService';
```

### Send Chat Message
```typescript
const response = await aiChatService.sendMessage([
  { role: 'user', content: 'Hello!' }
]);
console.log(response.response);
```

### Query Single Question
```typescript
const result = await aiChatService.query('What is FastAPI?');
console.log(result.answer);
```

### Check Health
```typescript
const health = await aiChatService.checkHealth();
console.log(health.status);
```

## Troubleshooting

### Port Conflicts
- **Gateway:** Port 8000
- **Admin Service:** Port 8009
- Ensure both services are running

### CORS Issues
- Gateway CORS is configured for: `http://localhost:3000`
- Update `FRONTEND_URL` in `.env` if needed

### Connection Errors
1. Check Admin Service is running:
   ```bash
   curl http://localhost:8009/health
   ```

2. Check Gateway is running:
   ```bash
   curl http://localhost:8000/health
   ```

3. Check routing through gateway:
   ```bash
   curl http://localhost:8000/api/rag/health
   ```

## Next Steps

1. **Add Authentication**
   - Integrate with auth service
   - Protect admin endpoints

2. **Rate Limiting**
   - Add per-user rate limits
   - Prevent abuse

3. **Monitoring**
   - Add metrics collection
   - Track usage analytics

4. **Caching**
   - Cache frequent queries
   - Reduce load on RAG system

## Summary

✅ **All traffic now flows through API Gateway**
- Frontend → Port 8000 → Port 8009
- Consistent, scalable architecture
- Production-ready setup
- Easy to add security and monitoring

---

**Created:** October 14, 2025
**Status:** ✅ Implemented and Tested
