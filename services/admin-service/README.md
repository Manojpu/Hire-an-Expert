# Admin Service - Lightweight RAG System

A complete Retrieval-Augmented Generation (RAG) service for the Hire-an-Expert platform. Powers the AI chatbot that answers questions based on uploaded documents.

## 🚀 Features

- **Lightweight RAG**: Pinecone vector database + Google Gemini AI
- **Document Processing**: Support for PDF and TXT files
- **Word-based Chunking**: 500 words per chunk with 50-word overlap
- **Vector Embeddings**: Google Gemini embedding-001 (768 dimensions)
- **LLM Integration**: Google Gemini 2.0 Flash for answer generation
- **MongoDB GridFS**: Document storage and metadata
- **RESTful API**: FastAPI with automatic OpenAPI docs
- **Docker Ready**: Simple containerization with docker-compose

## 📋 Technology Stack

- **Framework**: FastAPI 0.119.0
- **Vector Database**: Pinecone (cloud-hosted)
- **Embeddings**: Google Gemini embedding-001
- **LLM**: Google Gemini 2.0 Flash Exp
- **Document Storage**: MongoDB GridFS
- **PDF Processing**: pypdf
- **Runtime**: Python 3.11

## 🏗️ Architecture

```
User Query → API Gateway → Admin Service
                              ↓
                         RAG Engine
                              ↓
          ┌──────────────────┼──────────────────┐
          ↓                  ↓                  ↓
    Gemini Service    Pinecone Service    MongoDB Service
          ↓                  ↓                  ↓
    (Embeddings +      (Vector Search)    (Document Store)
     Answer Gen)
```

## � Project Structure

```
admin-service/
├── app/
│   ├── config.py              # Settings and environment variables
│   ├── routes/
│   │   └── rag_routes.py      # RAG API endpoints
│   └── services/
│       ├── document_processor.py   # PDF/TXT chunking
│       ├── gemini_service.py       # Gemini embeddings & LLM
│       ├── pinecone_service.py     # Vector operations
│       ├── mongodb_service.py      # Document storage
│       └── rag_engine.py           # Main RAG coordinator
├── main.py                    # FastAPI application entry
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
├── Dockerfile                 # Container image
└── docker-compose.yml         # Docker orchestration
```

## 🚀 Setup Guide

### Prerequisites

- Python 3.11+
- MongoDB Atlas account (or local MongoDB)
- Pinecone account and API key
- Google Cloud API key for Gemini

### Environment Variables

Create a `.env` file in the `services/admin-service/` directory:

```bash
# Application Settings
DEBUG=true
HOST=0.0.0.0
PORT=8009
SERVICE_NAME=admin-service

# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=hire_expert_admin

# Google Gemini API Configuration
GOOGLE_API_KEY=your-gemini-api-key-here

# Gemini Models
GEMINI_MODEL=models/gemini-2.0-flash-exp
GEMINI_EMBEDDING_MODEL=models/embedding-001

# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=hire-expert-rag
PINECONE_ENVIRONMENT=us-east-1-aws
VECTOR_DIMENSION=768

# RAG Configuration
CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RESULTS=5

# File Upload Configuration
MAX_UPLOAD_SIZE=10485760
ALLOWED_EXTENSIONS=[".pdf",".txt"]
UPLOAD_DIR=./uploads

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Default Admin Credentials
ADMIN_EMAIL=admin@hireexpert.com
ADMIN_PASSWORD=admin123

# External Service URLs
USER_SERVICE_URL=http://localhost:8006
AUTH_SERVICE_URL=http://localhost:8001
BOOKING_SERVICE_URL=http://localhost:8003
GIG_SERVICE_URL=http://localhost:8004
MESSAGE_SERVICE_URL=http://localhost:8005
PAYMENT_SERVICE_URL=http://localhost:8008
```

---

## 🖥️ Running Locally (Development)

### 1. Create Virtual Environment

**Windows (PowerShell):**
```powershell
cd services\admin-service
python -m venv venv
.\venv\Scripts\activate
```

**macOS/Linux:**
```bash
cd services/admin-service
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment

Ensure your `.env` file is properly configured (see Environment Variables section above).

### 4. Run the Service

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8009
```

Or for debug mode with detailed logs:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8009 --log-level debug
```

### 5. Verify It's Running

Open your browser and navigate to:
- **Service Health**: http://localhost:8009/health
- **API Documentation**: http://localhost:8009/docs
- **Alternative Docs**: http://localhost:8009/redoc

---

## 🐳 Running with Docker

### Option 1: Docker Compose (Recommended)

The easiest way to run the service in a container.

**1. Build and Start:**
```bash
cd services/admin-service
docker compose up --build
```

**2. Run in Background:**
```bash
docker compose up -d
```

**3. View Logs:**
```bash
docker compose logs -f admin-service
```

**4. Stop Service:**
```bash
docker compose down
```

### Option 2: Docker Build & Run Manually

**1. Build Image:**
```bash
cd services/admin-service
docker build -t hire-expert-admin:latest .
```

**2. Run Container:**
```bash
docker run -d \
  --name hire-expert-admin \
  -p 8009:8009 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  hire-expert-admin:latest
```

**3. View Logs:**
```bash
docker logs -f hire-expert-admin
```

**4. Stop Container:**
```bash
docker stop hire-expert-admin
docker rm hire-expert-admin
```

---

## 📡 API Endpoints

### Health Check
```
GET /health
```

### RAG Endpoints

#### Upload Document
```http
POST /api/rag/upload
Content-Type: multipart/form-data

file: <PDF or TXT file>
```

#### Ingest File
```http
POST /api/rag/ingest/file
Content-Type: multipart/form-data

file: <PDF or TXT file>
```

#### Ingest Text
```http
POST /api/rag/ingest/text
Content-Type: application/json

{
  "text": "Your document text here",
  "metadata": {
    "title": "Document Title",
    "source": "manual_entry"
  }
}
```

#### Chat Query
```http
POST /api/rag/chat
Content-Type: application/json

{
  "message": "What is the refund policy?"
}
```

#### Query Documents
```http
POST /api/rag/query
Content-Type: application/json

{
  "query": "How do I book an expert?",
  "top_k": 5
}
```

#### List Documents
```http
GET /api/rag/list
GET /api/rag/documents
```

#### Delete Document
```http
DELETE /api/rag/documents/{document_id}
```

---

## 🧪 Testing the Service

### Using cURL

**Upload a document:**
```bash
curl -X POST http://localhost:8009/api/rag/upload \
  -F "file=@document.pdf"
```

**Ask a question:**
```bash
curl -X POST http://localhost:8009/api/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is this document about?"}'
```

**List all documents:**
```bash
curl http://localhost:8009/api/rag/documents
```

### Using Python

```python
import requests

# Upload document
with open('document.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8009/api/rag/upload',
        files={'file': f}
    )
    print(response.json())

# Ask question
response = requests.post(
    'http://localhost:8009/api/rag/chat',
    json={'message': 'What is the refund policy?'}
)
print(response.json())
```

---

## 🔧 Configuration Details

### Pinecone Setup

1. Create account at https://www.pinecone.io/
2. Create a new index:
   - **Name**: `hire-expert-rag`
   - **Dimensions**: `768`
   - **Metric**: `cosine`
   - **Environment**: `us-east-1-aws`
3. Copy your API key to `.env`

### Google Gemini Setup

1. Visit https://aistudio.google.com/app/apikey
2. Create a new API key
3. Add to `.env` as `GOOGLE_API_KEY`

### MongoDB Setup

1. Create MongoDB Atlas account or use local MongoDB
2. Create database: `hire_expert_admin`
3. Add connection URI to `.env`

---

## 🐛 Troubleshooting

### Service Won't Start

**Check Python version:**
```bash
python --version  # Should be 3.11+
```

**Verify dependencies:**
```bash
pip list | grep -E "fastapi|pinecone|google-generativeai"
```

### Import Errors

**Reinstall requirements:**
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Docker Issues

**Rebuild without cache:**
```bash
docker compose build --no-cache
docker compose up
```

**Check container logs:**
```bash
docker compose logs admin-service --tail 100
```

### Pinecone Connection Failed

- Verify API key in `.env`
- Check index name matches exactly
- Ensure index dimensions = 768

### Gemini API Errors

- Verify API key is valid
- Check quota limits at https://aistudio.google.com/
- Ensure models are spelled correctly

---

## 📊 Performance Notes

- **Chunk Size**: 500 words (optimal for most documents)
- **Vector Dimension**: 768 (Gemini embedding-001)
- **Top-K Results**: 5 (balance between context and performance)
- **Max Upload Size**: 10MB per file

---

## 🔐 Security Notes

- Never commit `.env` file to version control
- Change default admin credentials in production
- Use strong JWT secret keys
- Enable HTTPS in production
- Restrict CORS origins appropriately

---

## 📝 License

Part of the Hire-an-Expert platform.

---

## 🆘 Support

For issues or questions:
1. Check the [API Documentation](http://localhost:8009/docs)
2. Review logs: `docker compose logs admin-service`
3. Verify environment variables in `.env`

---

**Happy Building! 🚀**


│   │   ├── document_processor.py # Document loading & chunking

│   │   └── rag_engine.py        # RAG orchestration- [API Reference](#api-reference)

│   └── routes/             # API endpoints

│       ├── rag_routes.py        # RAG endpoints- [How It Works](#how-it-works)- **Text Ingestion**: Ingest raw text directly

│       ├── admin_routes.py      # Admin endpoints

│       └── analytics_routes.py  # Analytics endpoints- [Admin Dashboard](#admin-dashboard)

├── tests/                  # Test files

├── scripts/                # Utility scripts- [Usage Examples](#usage-examples)- [Overview](#overview)- **Vector Search**: Fast similarity search using FAISS

├── docs/                   # Documentation

├── data/                   # Data storage (FAISS cache)- [Troubleshooting](#troubleshooting)

├── uploads/                # Temporary file uploads

├── logs/                   # Application logs- [Features](#features)- **Smart Q&A**: Ask questions and get answers from your documents

├── main.py                 # FastAPI application entry point

├── Dockerfile              # Optimized multi-stage build (2.5GB)---

├── docker-compose.yml      # Docker Compose configuration

├── requirements.txt        # Python dependencies- [Technology Stack](#technology-stack)- **Chat Interface**: Conversational interface with context awareness

└── README.md               # This file

```## 🎯 Overview



## ⚡ Quick Start- [Architecture](#architecture)- **Document Management**: List, view, and delete documents



### Option 1: Docker (Recommended)The Admin Service is a powerful RAG (Retrieval-Augmented Generation) system that enables:



```bash- [Setup Guide](#setup-guide)- **Analytics**: Track usage and system statistics

# 1. Configure environment

cp .env.example .env- **Document Ingestion**: Upload PDFs, DOCX, TXT, and Markdown files

# Edit .env with your MongoDB URI and Google API key

- **Intelligent Search**: Vector-based similarity search using FAISS- [API Reference](#api-reference)

# 2. Build Docker image

docker build -t admin-service .- **AI-Powered Answers**: Context-aware responses using Google Gemini



# 3. Run container- **Document Management**: Full CRUD operations for knowledge base- [How It Works](#how-it-works)## 🛠️ Technology Stack

docker run -p 8009:8009 --env-file .env admin-service

- **Chat Interface**: Conversational AI chatbot for end users

# Or use docker-compose

docker-compose up -d- [Admin Dashboard](#admin-dashboard)

```

### What is RAG?

### Option 2: Local Development

- [Troubleshooting](#troubleshooting)- **LLM**: Google Gemini 1.5 Flash

```bash

# 1. Create virtual environmentRAG combines three key technologies:

python -m venv venv

venv\Scripts\activate  # Windows1. **Retrieval** - Find relevant information from your document collection- **Vector Database**: FAISS (local, no external service needed)

# source venv/bin/activate  # Linux/Mac

2. **Augmentation** - Add that context to the AI prompt

# 2. Install dependencies

pip install -r requirements.txt3. **Generation** - Let the AI generate accurate, contextual answers---- **Database**: MongoDB (for raw data and metadata)



# 3. Configure environment

cp .env.example .env

# Edit .env with your credentials---- **Framework**: LangChain (for document processing)



# 4. Run the service

python main.py

```## ✨ Features## 🎯 Overview- **Embeddings**: Sentence Transformers (local, free)



### Option 3: Quick Start Script



```bash### 📄 Document Management- **API**: FastAPI

# Windows

scripts\start.bat- ✅ Upload multiple file formats (PDF, DOCX, TXT, MD)

```

- ✅ Extract metadata (title, author, page count, file size)The Admin Service provides a complete RAG (Retrieval-Augmented Generation) system that:

## 🔧 Configuration

- ✅ Store original files in MongoDB GridFS

### Environment Variables (.env)

- ✅ View uploaded PDFs directly in browser## 📋 Prerequisites

```env

# MongoDB Configuration- ✅ Delete documents with automatic cleanup

MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/

MONGO_DB_NAME=hire_expert_admin- **Ingests documents** (PDFs, DOCX, TXT, MD files) and text content



# Google Gemini API### 🤖 Smart AI Chatbot

GOOGLE_API_KEY=your-api-key-here

GEMINI_MODEL=models/gemini-2.5-flash- ✅ Natural language question answering- **Stores vectors** in FAISS for fast similarity search1. **Python 3.11+**



# Service Configuration- ✅ Context-aware responses from documents

HOST=0.0.0.0

PORT=8009- ✅ Clean, formatted answers with bullet points- **Answers questions** using Google Gemini AI with document context2. **MongoDB** (local or Atlas)

DEBUG=false

- ✅ Fast responses (3-10 seconds)

# RAG Configuration

CHUNK_SIZE=1000- ✅ Fallback handling for edge cases- **Manages documents** through an admin dashboard3. **Google Gemini API Key** - Get it from [Google AI Studio](https://makersuite.google.com/app/apikey)

CHUNK_OVERLAP=200

TOP_K_RESULTS=5

EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

```### 🔍 Search & Retrieval- **Powers the chatbot** on the frontend for users



### Get API Keys- ✅ Vector similarity search using FAISS



- **MongoDB**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)- ✅ Semantic understanding of queries## 🔧 Setup Instructions

- **Google Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)

- ✅ Multi-document search

## 📚 API Endpoints

- ✅ Ranked results by relevance### What is RAG?

Once running, visit: **http://localhost:8009/docs**



### RAG Endpoints

### 📊 Analytics & Monitoring### 1. Install Dependencies

- `POST /api/rag/ingest-file` - Upload and process document

- `POST /api/rag/ingest-text` - Add text content- ✅ Document count statistics

- `POST /api/rag/chat` - Chat with RAG system

- `POST /api/rag/search` - Search documents- ✅ Chunk count trackingRAG (Retrieval-Augmented Generation) combines:

- `GET /api/rag/documents` - List all documents

- `DELETE /api/rag/documents/{doc_id}` - Delete document- ✅ API logging and monitoring



### Admin Endpoints1. **Document Search** - Find relevant information from your documents```powershell



- `GET /health` - Health check---

- `GET /api/admin/stats` - System statistics

2. **AI Generation** - Use that information to generate accurate answerscd services\admin-service

### Analytics Endpoints

## 🛠️ Technology Stack

- `GET /api/analytics/documents` - Document analytics

- `GET /api/analytics/conversations` - Conversation analytics3. **Context Awareness** - Maintain conversation history for better responsespip install -r requirements.txt



## 🧪 Testing| Component | Technology | Purpose |



```bash|-----------|-----------|---------|```

# Activate virtual environment

venv\Scripts\activate| **LLM** | Google Gemini 2.5 Flash | AI text generation |



# Run tests| **Vector DB** | FAISS | Fast similarity search |---

python tests/test_rag.py

python tests/test_mongodb_loading.py| **Database** | MongoDB + GridFS | Document storage |



# Check GridFS storage| **Framework** | LangChain | Document processing |### 2. Configure Environment

python tests/check_gridfs.py

| **Embeddings** | Sentence Transformers | Text vectorization |

# Load sample data

python scripts/load_sample_data.py| **API** | FastAPI | REST endpoints |## ✨ Features



# Upload documents via CLI| **Language** | Python 3.11+ | Core implementation |

python scripts/add_documents.py

```Edit `.env` file and add your Gemini API key:



## 🐳 Docker---



### Optimized Image (2.5GB)### Document Management



Our Docker image is optimized from 12.7GB to **2.5GB**:## 🏗️ Architecture



- ✅ CPU-only PyTorch (no CUDA libraries)- ✅ Upload PDF, DOCX, TXT, MD files```env

- ✅ Multi-stage build (no build tools in final image)

- ✅ Explicit dependencies (no bloat)```



### Docker Commands┌─────────────────────────────────────────────────────────────┐- ✅ Add text documents directlyGOOGLE_API_KEY=your-gemini-api-key-here



```bash│                     Frontend (React)                         │

# Build

docker build -t admin-service:latest .│  • Admin Dashboard  • Chat Widget  • Document Upload        │- ✅ View uploaded documents with metadataMONGO_URI=mongodb://localhost:27017/



# Run detached└────────────────────────┬────────────────────────────────────┘

docker run -d -p 8009:8009 --name admin-service --env-file .env admin-service:latest

                         │- ✅ Delete documents```

# View logs

docker logs -f admin-service                         ▼



# Stop┌─────────────────────────────────────────────────────────────┐- ✅ GridFS storage for original PDFs

docker stop admin-service

│                   API Gateway (Port 8000)                    │

# Docker Compose

docker-compose up -d│            Routes: /api/rag/* → Admin Service               │### 3. Run the Service

docker-compose logs -f

docker-compose down└────────────────────────┬────────────────────────────────────┘

```

                         │### Smart AI Chatbot

## 🏗️ Architecture

                         ▼

### RAG System Flow

┌─────────────────────────────────────────────────────────────┐- ✅ Natural language Q&A```powershell

```

1. Document Upload → MongoDB GridFS + text extraction│              Admin Service (Port 8009)                       │

2. Text Processing → Chunking (1000 chars) → Embeddings

3. Vector Storage → FAISS (RAM) + MongoDB GridFS (persistence)│  ┌─────────────────────────────────────────────────────┐   │- ✅ Context-aware conversationspython main.py

4. Chat Query → Vector search → Context + Gemini → Response

```│  │              RAG Engine (Core Logic)                 │   │



### Storage Locations│  │  • Document Ingestion  • Vector Search  • Chat      │   │- ✅ Fast responses (3-10 seconds)```



1. **MongoDB GridFS** - Original files (PDF, DOCX)│  └─────────────────────────────────────────────────────┘   │

2. **MongoDB Collections** - Documents metadata, chunks

3. **FAISS Index (RAM)** - Fast vector search│                                                              │- ✅ Clean, formatted answers with bullet points

4. **Local Cache** - `./data/faiss_index/` 

5. **MongoDB GridFS** - FAISS backup (cloud persistence)│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │



## 📊 Performance│  │   Document   │  │    Vector    │  │    Gemini    │     │- ✅ Works with ANY uploaded documentThe service will start on `http://localhost:8009`



- **Startup**: ~20-30 seconds│  │  Processor   │  │   Store      │  │   Service    │     │

- **Vector search**: 10-50ms

- **Document upload**: 2-5 seconds│  └──────────────┘  └──────────────┘  └──────────────┘     │

- **RAG chat**: 1-3 seconds

- **Memory**: ~800MB-1GB└────────┬──────────────────┬─────────────────┬──────────────┘



## 📦 Dependencies         │                  │                 │### Admin Dashboard## 📚 API Documentation



### Core         ▼                  ▼                 ▼

- FastAPI 0.119.0, Uvicorn 0.37.0

- PyMongo 4.15.3, Motor 3.7.1┌─────────────────┐ ┌──────────────┐ ┌───────────────┐- ✅ Document upload interface



### AI/ML│    MongoDB      │ │    FAISS     │ │Google Gemini  │

- Google Gemini 0.8.5

- FAISS 1.12.0 (CPU-only)│   + GridFS      │ │   (Local)    │ │     API       │- ✅ Document list with search/filterOnce running, visit:

- SentenceTransformers 5.1.1

- PyTorch 2.8.0 (CPU-only)│                 │ │              │ │               │

- LangChain 0.3.27

│ • Documents     │ │ • Vectors    │ │ • Text Gen    │- ✅ View original PDFs- **Interactive API Docs**: http://localhost:8009/docs

### Document Processing

- pypdf 6.1.1, python-docx 1.2.0│ • Chunks        │ │ • Index      │ │ • Chat        │

- beautifulsoup4 4.14.2

│ • Files         │ │              │ │               │- ✅ System statistics- **Alternative Docs**: http://localhost:8009/redoc

## 🛠️ Development

└─────────────────┘ └──────────────┘ └───────────────┘

```bash

# Setup```- ✅ Real-time updates

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env---### Quick Start Examples



# Run with auto-reload

uvicorn main:app --reload --port 8009

## 🚀 Setup Guide### API

# Or use script

scripts\start.bat

```

### Prerequisites- ✅ 15+ REST endpoints#### 1. Upload a Document

## 📖 Documentation



See `docs/` folder for detailed documentation:

1. **Python 3.11+** installed- ✅ Document ingestion

- **DOCKER_QUICK_START.md** - Docker setup

- **CONTAINER_RUNNING.md** - Container management2. **MongoDB** running (local or Atlas)

- **OPTIMIZATION_DETAILS.md** - Docker optimization explained

- **MONGODB_VECTOR_STORAGE.md** - Vector storage architecture3. **Google Gemini API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)- ✅ Query and chat endpoints```bash



## 🚀 Deployment



### AWS ECS/Fargate### Step 1: Install Dependencies- ✅ Document management CRUDcurl -X POST "http://localhost:8009/api/rag/ingest/file" \

```bash

docker tag admin-service <account>.dkr.ecr.us-east-1.amazonaws.com/admin-service

docker push <account>.dkr.ecr.us-east-1.amazonaws.com/admin-service

``````powershell- ✅ Interactive API documentation  -F "file=@document.pdf" \



### Production Checklistcd services\admin-service

- [ ] Set `DEBUG=false`

- [ ] Use production MongoDBpip install -r requirements.txt  -F "source_type=file"

- [ ] Use secrets manager for API keys

- [ ] Set up monitoring/logging```

- [ ] Configure auto-scaling

- [ ] Enable HTTPS/SSL---```



## 🐛 Troubleshooting### Step 2: Configure Environment



**MongoDB Connection Failed:**

- Check `MONGO_URI` in .env

- Verify IP whitelistCreate/edit `.env` file:

- Test: `python tests/check_gridfs.py`

## 🛠️ Technology Stack#### 2. Ingest Text

**Gemini API Error:**

- Verify `GOOGLE_API_KEY` in .env```env

- Check quota at [Google AI Studio](https://makersuite.google.com)

# Google Gemini API

**Port Already in Use:**

- Change `PORT` in .envGOOGLE_API_KEY=your-gemini-api-key-here

- Or: `netstat -ano | findstr :8009`

| Component | Technology | Purpose |```bash

**Out of Memory:**

- Increase Docker memory in Settings# MongoDB Configuration

- Or reduce `CHUNK_SIZE` in .env

MONGO_URI=mongodb://localhost:27017/|-----------|-----------|---------|curl -X POST "http://localhost:8009/api/rag/ingest/text" \

---

MONGO_DB_NAME=hire_expert

**Version**: 1.0.0  

**Docker Image**: 2.5GB (optimized)  | **LLM** | Google Gemini 2.5 Flash | AI response generation |  -H "Content-Type: application/json" \

**Status**: ✅ Production Ready  

**API Docs**: http://localhost:8009/docs# Service Configuration


SERVICE_NAME=admin-service| **Vector DB** | FAISS | Fast similarity search (local, no external service) |  -d '{

SERVICE_PORT=8009

LOG_LEVEL=INFO| **Database** | MongoDB + GridFS | Document storage and metadata |    "text": "Your text content here...",



# File Upload Settings| **Embeddings** | Sentence Transformers | Local text embeddings (free) |    "title": "My Document",

UPLOAD_DIR=uploads

MAX_FILE_SIZE_MB=50| **Framework** | LangChain | Document processing and chunking |    "source_type": "text"

ALLOWED_EXTENSIONS=[".pdf", ".txt", ".docx", ".md"]

| **API** | FastAPI | High-performance REST API |  }'

# Vector Store Settings

VECTOR_STORE_PATH=data/faiss_index| **Language** | Python 3.11+ | Backend implementation |```

CHUNK_SIZE=1000

CHUNK_OVERLAP=200

```

**Why these technologies?**#### 3. Ask a Question

### Step 3: Start the Service

- **FAISS**: Free, fast, runs locally (no external vector DB needed)

**Development Mode (with auto-reload):**

```powershell- **Gemini**: Fast, accurate, generous free tier (60 requests/minute)```bash

.\start.bat

# or- **MongoDB**: Already used in the projectcurl -X POST "http://localhost:8009/api/rag/query" \

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8009

```- **Sentence Transformers**: Free local embeddings (no API costs)  -H "Content-Type: application/json" \



**Production Mode:**  -d '{

```powershell

python main.py---    "question": "What is the main topic?",

```

    "user_id": "user123",

### Step 4: Verify Installation

## 🏗️ Architecture    "include_sources": true

Check health endpoint:

```powershell  }'

curl http://localhost:8009/health

```### System Workflow```



Expected response:

```json

{```#### 4. Chat with Context

  "status": "healthy",

  "service": "admin-service",┌─────────────────────────────────────────────────────────────┐

  "timestamp": "2025-10-15T10:30:00Z"

}│                    ADMIN UPLOADS DOCUMENT                    │```bash

```

└────────────────────────┬────────────────────────────────────┘curl -X POST "http://localhost:8009/api/rag/chat" \

---

                         │  -H "Content-Type: application/json" \

## 📚 API Reference

                         ▼  -d '{

### Base URL

```┌─────────────────────────────────────────────────────────────┐    "messages": [

http://localhost:8000/api/rag  (via API Gateway)

http://localhost:8009          (direct access)│              Document Processing Pipeline                    │      {"role": "user", "content": "Hello!"},

```

│  1. Extract text (PyPDF, python-docx)                       │      {"role": "assistant", "content": "Hi! How can I help?"},

### Endpoints

│  2. Split into chunks (1000 chars, 200 overlap)             │      {"role": "user", "content": "Tell me about the documents"}

#### 1. Upload File

**POST** `/ingest/file`│  3. Generate embeddings (Sentence Transformers)             │    ],



Upload PDF, DOCX, TXT, or MD files.│  4. Store in FAISS (vectors) + MongoDB (text + metadata)    │    "use_context": true



```bash│  5. Store original PDF in GridFS                            │  }'

curl -X POST "http://localhost:8000/api/rag/ingest/file" \

  -F "file=@document.pdf" \└────────────────────────┬────────────────────────────────────┘```

  -F "source_type=user_upload"

```                         │



**Response:**                         ▼## 📊 Key Endpoints

```json

{┌─────────────────────────────────────────────────────────────┐

  "status": "success",

  "message": "File document.pdf ingested successfully",│                  USER ASKS QUESTION                          │### Document Ingestion

  "document_id": "507f1f77bcf86cd799439011",

  "chunks_created": 15,└────────────────────────┬────────────────────────────────────┘- `POST /api/rag/ingest/file` - Upload a file

  "filename": "document.pdf"

}                         │- `POST /api/rag/ingest/text` - Ingest raw text

```

                         ▼

#### 2. Add Text Document

**POST** `/ingest/text`┌─────────────────────────────────────────────────────────────┐### Querying



Add text content directly.│                   Query Processing                           │- `POST /api/rag/query` - Ask a question



```bash│  1. Convert question to embedding                           │- `POST /api/rag/query/stream` - Stream response

curl -X POST "http://localhost:8000/api/rag/ingest/text" \

  -H "Content-Type: application/json" \│  2. Search FAISS for similar chunks (top 3)                 │- `POST /api/rag/chat` - Chat with context

  -d '{

    "title": "Platform Policy",│  3. Retrieve full chunk text from MongoDB                   │

    "text": "Your document content here...",

    "metadata": {"category": "policy"}│  4. Send to Gemini with context                             │### Document Management

  }'

```│  5. Generate clean, formatted answer                        │- `GET /api/rag/documents` - List all documents



#### 3. List Documents└────────────────────────┬────────────────────────────────────┘- `GET /api/rag/documents/{id}` - Get document details

**GET** `/documents?skip=0&limit=50`

                         │- `DELETE /api/rag/documents/{id}` - Delete document

Get all documents with pagination.

                         ▼

```bash

curl "http://localhost:8000/api/rag/documents?limit=10"┌─────────────────────────────────────────────────────────────┐### Analytics

```

│              USER RECEIVES ANSWER                            │- `GET /api/rag/stats` - System statistics

**Response:**

```json│  • Clean, formatted response                                │- `GET /api/analytics/overview` - Analytics overview

{

  "documents": [│  • Bullet points for readability                            │- `GET /api/analytics/documents/stats` - Document stats

    {

      "_id": "507f1f77bcf86cd799439011",│  • Under 200 words (concise)                                │

      "title": "Platform Guide",

      "source_type": "file",│  • Based on actual documents                                │### Admin

      "filename": "guide.pdf",

      "page_count": 10,└─────────────────────────────────────────────────────────────┘- `GET /api/admin/system/info` - System information

      "file_size": 153600,

      "created_at": "2025-10-15T10:00:00Z"```- `GET /api/admin/system/health` - Health check

    }

  ],- `GET /api/admin/users/conversations/{user_id}` - User conversations

  "count": 1,

  "skip": 0,### Data Flow

  "limit": 50

}## 🏗️ Architecture

```

1. **Document Upload**

#### 4. View PDF Document

**GET** `/documents/{document_id}/view`   - Admin uploads PDF → FastAPI receives file```



Opens the original PDF in browser.   - PyPDF extracts text and metadata (pages, author, etc.)┌─────────────────────────────────────────────────────┐



```bash   - GridFS stores original PDF for viewing│                   FastAPI Server                     │

curl "http://localhost:8000/api/rag/documents/507f1f77bcf86cd799439011/view"

```   - MongoDB stores document metadata│                    (Port 8009)                       │



#### 5. Delete Document└──────────────────┬──────────────────────────────────┘

**DELETE** `/documents/{document_id}`

2. **Chunking & Embedding**                   │

Delete document and all associated data.

   - LangChain splits text into 1000-char chunks       ┌───────────┼───────────┐

```bash

curl -X DELETE "http://localhost:8000/api/rag/documents/507f1f77bcf86cd799439011"   - Sentence Transformers creates embeddings       │           │           │

```

   - FAISS stores vectors for fast search       ▼           ▼           ▼

#### 6. Query (Q&A)

**POST** `/query`   - MongoDB stores chunk text┌─────────┐ ┌──────────┐ ┌──────────┐



Ask questions and get answers with sources.│ Gemini  │ │  FAISS   │ │ MongoDB  │



```bash3. **User Query**│ 1.5     │ │  Vector  │ │ Database │

curl -X POST "http://localhost:8000/api/rag/query" \

  -H "Content-Type: application/json" \   - User asks question in chatbot│ Flash   │ │  Store   │ │          │

  -d '{

    "question": "What is the refund policy?",   - Question converted to embedding└─────────┘ └──────────┘ └──────────┘

    "top_k": 3

  }'   - FAISS finds top 3 similar chunks     │           │            │

```

   - Full text retrieved from MongoDB     └───────────┴────────────┘

**Response:**

```json              │

{

  "status": "success",4. **AI Response**              ▼

  "question": "What is the refund policy?",

  "answer": "The platform offers full refunds if...",   - Chunks sent to Gemini as context     ┌─────────────────┐

  "context_used": true,

  "num_sources": 3,   - Gemini generates formatted answer     │   LangChain     │

  "sources": [

    {   - Safety filters applied     │   Document      │

      "document_id": "507f1f77bcf86cd799439011",

      "chunk_index": 0,   - Clean response returned to user     │   Processor     │

      "similarity": 0.87,

      "text_preview": "Refund Policy: Clients can..."     └─────────────────┘

    }

  ]---```

}

```



#### 7. Chat## 🚀 Setup Guide## 💾 Data Storage

**POST** `/chat`



Conversational interface with context awareness.

### Prerequisites### MongoDB Collections

```bash

curl -X POST "http://localhost:8000/api/rag/chat" \- `documents` - Raw document data and metadata

  -H "Content-Type: application/json" \

  -d '{1. **Python 3.11+** installed- `chunks` - Document chunks for retrieval

    "messages": [

      {"role": "user", "content": "How do payments work?"}2. **MongoDB** running (local or MongoDB Atlas)- `conversations` - User conversation history

    ],

    "use_context": true3. **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))

  }'

```### FAISS Index



**Response:**### Installation Steps- Stored locally in `./data/faiss_index/`

```json

{- Contains vector embeddings for fast similarity search

  "status": "success",

  "response": "Payments on the platform work as follows:\n* Securely processed through Stripe or PayHere\n* 10% platform service fee\n* 90% transferred to expert's account",#### 1. Get Gemini API Key- Automatically saved after each update

  "context_used": true,

  "sources_count": 3

}

```Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create a free API key.## 🔒 Security Notes



#### 8. System Statistics

**GET** `/stats`

**Free Tier**: 60 requests per minute - perfect for development!⚠️ **Important**: Before deploying to production:

Get system statistics.



```bash

curl "http://localhost:8000/api/rag/stats"#### 2. Install Dependencies1. Change `JWT_SECRET_KEY` in `.env`

```

2. Update admin credentials

**Response:**

```json```powershell3. Add authentication to endpoints

{

  "total_documents": 25,cd services\admin-service4. Configure CORS properly

  "total_chunks": 350,

  "vector_store_size": "15.2 MB",pip install -r requirements.txt5. Use HTTPS

  "db_size": "42.8 MB"

}```6. Secure MongoDB connection

```



---

#### 3. Configure Environment## 🐛 Troubleshooting

## 🔄 How It Works



### Document Upload Flow

Create/edit `.env` file:### "GOOGLE_API_KEY not set"

```

1. User uploads PDF → FrontendAdd your Gemini API key to `.env` file

   ↓

2. File sent to API Gateway → /api/rag/ingest/file```env

   ↓

3. Admin Service receives file# REQUIRED: Your Gemini API key### "MongoDB connection error"

   ↓

4. Document Processor extracts:GOOGLE_API_KEY=AIza...your-key-hereEnsure MongoDB is running and connection string is correct

   • Text content

   • Metadata (title, author, pages)

   • File saved to GridFS

   ↓# MongoDB connection (use your existing or local)### "Module not found" errors

5. Text chunked (1000 chars, 200 overlap)

   ↓MONGO_URI=mongodb://localhost:27017/Run `pip install -r requirements.txt`

6. Chunks embedded into vectors

   ↓MONGO_DB_NAME=hire_expert_admin

7. Stored in:

   • MongoDB (text + metadata)### FAISS initialization fails

   • FAISS (vectors for search)

   ↓# Model settings (defaults are good)Delete `./data/faiss_index/` and restart

8. Success response to frontend

```GEMINI_MODEL=models/gemini-2.5-flash



### Chat/Query FlowEMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2## 📈 Performance Tips



```

1. User asks: "How do payments work?"

   ↓# API settings- **Chunk Size**: Adjust `CHUNK_SIZE` for your documents (default: 1000)

2. Question sent to /api/rag/chat

   ↓PORT=8009- **Top K**: Increase `TOP_K_RESULTS` for more context (default: 5)

3. RAG Engine:

   a. Convert question to vectorLOG_LEVEL=INFO- **Overlap**: More overlap = better context but slower (default: 200)

   b. Search FAISS for similar chunks (top 3-5)

   c. Retrieve full text from MongoDB```

   ↓

4. Build context from retrieved chunks## 🚀 Next Steps

   ↓

5. Send to Gemini:#### 4. Run the Service

   Prompt: "Answer based on this context: [chunks]

            Question: How do payments work?"1. Integrate with your messaging service

   ↓

6. Gemini generates clean, formatted answer**Development mode (with auto-reload):**2. Add authentication/authorization

   ↓

7. Response sent back to user:```powershell3. Create a frontend interface

   "Payments work as follows:

    * Processed via Stripe/PayHerepython -m uvicorn main:app --reload --host 0.0.0.0 --port 8009 --log-level debug4. Set up monitoring and logging

    * 10% service fee

    * 90% to expert account"```5. Deploy to production

```



### Vector Search Process

**Production mode:**## 📝 License

```

Query: "payment refund policy"```powershell

   ↓

1. Embed query → [0.23, -0.45, 0.67, ...]python main.pyPart of the Hire-an-Expert platform.

   ↓

2. FAISS similarity search```

   ↓

3. Find top 5 most similar chunks:#### 5. Verify Installation

   • Chunk A: 0.89 similarity (payment section)

   • Chunk B: 0.76 similarity (refund policy)- **API Docs**: http://localhost:8009/docs

   • Chunk C: 0.65 similarity (fees)- **Health Check**: http://localhost:8009/health

   ↓

4. Return chunks with context---

```

## 📡 API Reference

---

Base URL: `http://localhost:8009/api/rag`

## 🎨 Admin Dashboard

### Document Ingestion

Access at: `http://localhost:3000/admin/rag-system`

#### Upload File

### Features```http

POST /ingest/file

1. **Knowledge Base Tab**Content-Type: multipart/form-data

   - View all uploaded documents

   - Search/filter documentsfile: <PDF/DOCX/TXT/MD file>

   - Upload new documentssource_type: "file" (optional)

   - Delete documents```

   - View PDFs directly

**Response:**

2. **Upload Options**```json

   - **Upload File**: PDF, DOCX, TXT, MD{

   - **Add Text**: Direct text entry with title  "status": "success",

  "message": "File uploaded successfully",

3. **Document Table Columns**  "document_id": "507f1f77bcf86cd799439011",

   - Title  "chunks_created": 5,

   - Type (file/text)  "filename": "guide.pdf",

   - Source Type  "title": "Platform Guide"

   - Date Added}

   - Status```

   - Actions (View, Delete)

#### Ingest Text

4. **Statistics Dashboard**```http

   - Total documentsPOST /ingest/text

   - Total chunksContent-Type: application/json

   - Storage usage

{

---  "text": "Your content here...",

  "title": "Document Title",

## 💡 Usage Examples  "source_type": "text",

  "metadata": {"category": "FAQ"}

### Example 1: Upload Platform Documentation}

```

```python

import requests### Querying



# Upload a PDF#### Query (One-time Question)

with open('Platform_Guide.pdf', 'rb') as f:```http

    files = {'file': f}POST /query

    response = requests.post(Content-Type: application/json

        'http://localhost:8000/api/rag/ingest/file',

        files=files{

    )  "question": "How do payments work?",

    print(response.json())  "user_id": "user123",

```  "top_k": 5,

  "include_sources": true

### Example 2: Add Text Policy}

```

```python

import requests**Response:**

```json

data = {{

    "title": "Refund Policy",  "status": "success",

    "text": """  "question": "How do payments work?",

    Refund Policy:  "answer": "Payments are processed through Stripe or PayHere...",

    - Full refund within 24 hours  "context_used": true,

    - 5% fee after 24 hours  "num_sources": 3,

    - Processed in 5-7 business days  "sources": [

    """,    {

    "metadata": {"category": "policy"}      "document_id": "...",

}      "chunk_index": 0,

      "similarity": 0.85,

response = requests.post(      "text_preview": "..."

    'http://localhost:8000/api/rag/ingest/text',    }

    json=data  ]

)}

print(response.json())```

```

#### Chat (Conversational)

### Example 3: Ask Questions```http

POST /chat

```pythonContent-Type: application/json

import requests

{

# Query  "messages": [

response = requests.post(    {"role": "user", "content": "How do I find a gig?"},

    'http://localhost:8000/api/rag/query',    {"role": "assistant", "content": "Browse available gigs..."},

    json={"question": "What is the refund policy?", "top_k": 3}    {"role": "user", "content": "What about payments?"}

)  ],

print(response.json()['answer'])  "user_id": "user123",

  "use_context": true

# Chat}

response = requests.post(```

    'http://localhost:8000/api/rag/chat',

    json={**Response:**

        "messages": [```json

            {"role": "user", "content": "How do payments work?"}{

        ]  "status": "success",

    }  "response": "Payments are processed securely...",

)  "context_used": true,

print(response.json()['response'])  "sources_count": 3

```}

```

---

### Document Management

## 🐛 Troubleshooting

#### List Documents

### Issue: "ModuleNotFoundError"```http

**Solution:**GET /documents?skip=0&limit=50

```powershell```

pip install -r requirements.txt

```#### Get Document

```http

### Issue: "MongoDB connection failed"GET /documents/{document_id}

**Solution:**```

1. Check MongoDB is running: `mongod --version`

2. Verify MONGO_URI in `.env`#### View PDF

3. Test connection: `mongosh mongodb://localhost:27017````http

GET /documents/{document_id}/view

### Issue: "Gemini API error"```

**Solution:**Returns the original PDF file from GridFS.

1. Verify API key in `.env`

2. Check quota at [Google AI Studio](https://makersuite.google.com)#### Delete Document

3. Ensure API key has proper permissions```http

DELETE /documents/{document_id}

### Issue: "FAISS index not found"```

**Solution:**

```powershell### System Info

# Delete and rebuild index

Remove-Item -Recurse -Force data\faiss_index#### Statistics

# Restart service - index will rebuild from MongoDB```http

.\start.batGET /stats

``````



### Issue: "PDF upload fails"**Response:**

**Solution:**```json

1. Check file size < 50MB{

2. Verify file is valid PDF  "total_documents": 15,

3. Check upload directory exists: `mkdir uploads`  "total_chunks": 87,

  "total_queries": 234,

### Issue: "Slow chat responses"  "total_conversations": 45,

**Solution:**  "avg_chunks_per_document": 5.8

- Reduce `CHUNK_SIZE` in config}

- Limit `top_k` in search```

- Check network latency to Gemini API

#### Health Check

### Issue: "Chat returns errors"```http

**Solution:**GET /health

1. Check admin-service logs```

2. Verify documents are uploaded

3. Test with simple query: "hi"---

4. Check Gemini API status

## 🔧 How It Works

---

### Document Processing

## 📁 Project Structure

1. **File Upload**

```   - Supported: PDF, DOCX, TXT, MD

admin-service/   - Max size: 10MB (configurable)

│   - Extracted: text, metadata, page count

├── main.py                 # FastAPI application entry

├── requirements.txt        # Python dependencies2. **Text Extraction**

├── .env                    # Environment configuration   - PDF: PyPDF2 (extracts title, author, pages)

├── start.bat              # Windows startup script   - DOCX: python-docx

├── README.md              # This file   - TXT/MD: Direct read

│

├── app/3. **Chunking Strategy**

│   ├── __init__.py   - Chunk size: 1000 characters

│   ├── config.py          # Configuration management   - Overlap: 200 characters

│   │   - Splitter: RecursiveCharacterTextSplitter

│   ├── database/   - Preserves context between chunks

│   │   └── mongodb.py     # MongoDB + GridFS client

│   │4. **Embedding Generation**

│   ├── rag/   - Model: `all-MiniLM-L6-v2` (384 dimensions)

│   │   ├── rag_engine.py       # Core RAG orchestration   - Local processing (no API calls)

│   │   ├── document_processor.py  # File processing   - Free and fast

│   │   ├── vector_store.py     # FAISS operations

│   │   └── gemini_service.py   # Gemini AI integration5. **Storage**

│   │   - **FAISS**: Vector embeddings (fast search)

│   └── routes/   - **MongoDB**: Document metadata + chunk text

│       └── rag_routes.py  # API endpoints   - **GridFS**: Original PDF files

│

├── data/### Query Processing

│   └── faiss_index/       # FAISS vector database

│       ├── index.faiss1. **Question Embedding**

│       └── index.pkl   - Same model as documents

│   - 384-dimensional vector

├── uploads/               # Temporary file storage

│2. **Similarity Search**

└── logs/                  # Application logs   - FAISS cosine similarity

```   - Top 3-5 most relevant chunks

   - Returns chunk text from MongoDB

---

3. **Context Building**

## 🔐 Security Considerations   - Combines top chunks (up to 2000 chars each)

   - Cleans text (removes line breaks)

1. **API Key Protection**   - Formatted for Gemini

   - Never commit `.env` to git

   - Use environment variables in production4. **AI Generation**

   - Rotate keys regularly   - Model: Gemini 2.5 Flash

   - Temperature: 0.4 (balanced)

2. **File Upload Security**   - Max tokens: 400

   - Validate file types   - Safety filters: BLOCK_ONLY_HIGH

   - Limit file sizes

   - Scan for malware (optional)5. **Response Formatting**

   - Bullet points for lists

3. **MongoDB Security**   - Concise (under 200 words)

   - Use authentication in production   - Professional tone

   - Enable SSL/TLS   - Fallback: Shows document excerpt if AI fails

   - Limit network access

### Chat System

4. **Rate Limiting**

   - Implement API rate limits- Maintains conversation context

   - Monitor usage patterns- Uses last message for search

   - Prevent abuse- Greetings skip document search (faster)

- Full document context for questions

---

---

## 🚀 Deployment

## 🎨 Admin Dashboard

### Production Checklist

Access at: `http://localhost:5173/admin-rag` (when frontend is running)

- [ ] Set `LOG_LEVEL=ERROR` in production

- [ ] Use MongoDB Atlas for database### Features

- [ ] Enable MongoDB authentication

- [ ] Set up SSL certificates1. **Knowledge Base Tab**

- [ ] Configure CORS properly   - View all documents

- [ ] Implement rate limiting   - Search/filter documents

- [ ] Set up monitoring (Prometheus/Grafana)   - Upload new documents (files or text)

- [ ] Configure backup strategy   - View original PDFs

- [ ] Use reverse proxy (Nginx)   - Delete documents

- [ ] Set resource limits

2. **Upload Text Document**

### Docker Deployment (Optional)   - Modal form

   - Title + Content fields

```dockerfile   - Instant processing

# Dockerfile included in directory

docker build -t admin-service .3. **Upload File**

docker run -p 8009:8009 --env-file .env admin-service   - Drag & drop or select

```   - Progress indicator

   - Supported formats shown

---

4. **Document Table**

## 📊 Performance Metrics   - Title, Type, Date, Status

   - View button (for PDFs)

| Operation | Average Time | Notes |   - Delete button

|-----------|-------------|-------|   - Responsive design

| File Upload (10MB PDF) | 2-5 seconds | Depends on file size |

| Document Deletion | 0.5-1 second | Includes FAISS cleanup |### How to Use

| Vector Search | 50-200ms | For 1000 documents |

| Chat Response | 3-10 seconds | Includes Gemini API call |**Add a Text Document:**

| Query (with sources) | 2-6 seconds | Depends on context size |1. Click "Add Text Document"

2. Enter title (e.g., "Refund Policy")

---3. Enter content

4. Click "Add Document"

## 🤝 Contributing5. Done! Chatbot can now answer questions about it



For changes or improvements:**Upload a PDF:**

1. Follow existing code structure1. Click "Upload File"

2. Add comments for complex logic2. Select your PDF

3. Update this README if adding features3. Wait for upload (shows progress)

4. Test thoroughly before deployment4. Done! PDF is indexed automatically



---**Test the Chatbot:**

1. Open chat widget on any page

## 📄 License2. Ask a question (e.g., "What is the refund policy?")

3. Get instant, accurate answer!

Part of the Hire-an-Expert platform.

---

---

## 🐛 Troubleshooting

## 📞 Support

### Common Issues

For issues or questions:

- Check logs in `logs/` directory#### "Gemini API Error: Invalid API Key"

- Review [Troubleshooting](#troubleshooting) section**Solution:**

- Contact platform administrator```powershell

# Check your .env file

---cat .env | Select-String "GOOGLE_API_KEY"



**Last Updated:** October 15, 2025  # Get new key from: https://makersuite.google.com/app/apikey

**Version:** 2.0.0  ```

**Status:** Production Ready ✅

#### "MongoDB Connection Failed"
**Solution:**
```powershell
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Or update .env to use MongoDB Atlas
MONGO_URI=mongodb+srv://...
```

#### "FAISS Index Not Found"
**Solution:**
```powershell
# FAISS index is created automatically
# If missing, it rebuilds from MongoDB on startup
# Just restart the service
```

#### "Slow Responses (30+ seconds)"
**Cause:** Blocking Gemini API calls
**Fixed:** Now using async execution (3-10 seconds)

#### "Chat Returns Error Messages"
**Cause:** Gemini safety filters blocking content
**Fixed:** Safety settings configured, fallback to document excerpts

#### "Empty Answers / 'No information found'"
**Cause:** Documents not chunked properly or search not finding chunks
**Solution:**
- Check if documents uploaded: GET /api/rag/documents
- Re-upload documents
- Check FAISS index: logs will show chunk count

### Logs

Logs are written to:
- Console (stdout)
- `logs/admin-service.log` (if configured)

**Enable debug logging:**
```powershell
python -m uvicorn main:app --reload --log-level debug
```

### Reset Everything

```powershell
# Stop the service
# Delete FAISS index
Remove-Item -Recurse -Force data\faiss_index

# Drop MongoDB collections (optional)
mongosh hire_expert_admin --eval "db.dropDatabase()"

# Restart service - will rebuild from scratch
python main.py
```

---

## 📁 Project Structure

```
services/admin-service/
├── app/
│   ├── config.py              # Configuration settings
│   ├── database/
│   │   └── mongodb.py         # MongoDB + GridFS connection
│   ├── rag/
│   │   ├── document_processor.py  # Text extraction
│   │   ├── vector_store.py        # FAISS operations
│   │   ├── gemini_service.py      # Gemini AI integration
│   │   └── rag_engine.py          # Main RAG orchestration
│   └── routes/
│       └── rag_routes.py      # API endpoints
├── data/
│   └── faiss_index/           # FAISS vector index (auto-created)
├── uploads/                   # Temporary file storage
├── logs/                      # Application logs
├── .env                       # Environment configuration
├── requirements.txt           # Python dependencies
├── main.py                    # Application entry point
└── README.md                  # This file
```

---

## 🔐 Security

- **API Keys**: Stored in `.env`, never committed
- **File Upload**: Validated file types and sizes
- **GridFS**: Secure binary storage
- **MongoDB**: Connection via URI (supports auth)
- **CORS**: Configured for frontend origin

---

## 🚀 Performance

- **Query Response**: 3-10 seconds (with context)
- **Greetings**: 2-5 seconds (no context search)
- **Upload Processing**: Depends on file size
  - PDF (10 pages): ~5 seconds
  - Text: < 1 second
- **Concurrent Users**: Handles multiple simultaneous queries

**Optimizations:**
- Async Gemini calls (no blocking)
- FAISS in-memory search (fast)
- Chunk size optimized (1000 chars)
- Limited context (top 3 chunks, 2000 chars each)

---

## 📊 Current Status

✅ **Production Ready**

**Working Features:**
- ✅ Document upload (PDF, text, DOCX)
- ✅ Vector search and retrieval
- ✅ AI-powered Q&A
- ✅ Chat conversations
- ✅ Admin dashboard
- ✅ GridFS PDF storage
- ✅ Clean, formatted responses
- ✅ Fast performance
- ✅ Error handling and fallbacks

**Tested With:**
- Platform guides (User Guide, Expert Guide)
- Policy documents (Cancellation, Refund)
- Support information
- Custom text uploads

---

## 🆘 Support

**Issues?**
1. Check logs: `logs/admin-service.log`
2. Verify configuration: `.env` file
3. Test API: http://localhost:8009/docs
4. Check MongoDB: Connection and data
5. Verify Gemini API key

**Need Help?**
- Review this README
- Check API documentation at `/docs`
- Examine error logs

---

## 📝 License

Part of the Hire-an-Expert platform.

---

**Last Updated:** October 15, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
