# RAG Service - Quick Start Guide

## 🚀 Getting Started

### Step 1: Install Dependencies
```powershell
# Make sure you're in the RAG-service directory
cd services\RAG-service

# Activate your virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements-simple.txt
```

### Step 2: Configure Environment
```powershell
# Edit the .env file with your settings
notepad .env
```

**Important:** Add your OpenAI API key to the `.env` file:
```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### Step 3: Start the Service

**Option 1: Using the startup script (Recommended)**
```powershell
python start_rag.py
```

**Option 2: Manual startup**
```powershell
cd app
python main.py
```

### Step 4: Test the Service

Once running, visit:
- **Health Check:** http://localhost:8004/
- **API Documentation:** http://localhost:8004/docs
- **Health Details:** http://localhost:8004/health

### 🧪 Testing

Run the test script to verify everything works:
```powershell
python test_rag_service.py
```

## 📚 API Endpoints

- `GET /` - Basic health check
- `GET /health` - Detailed health check with component status
- `GET /docs` - Interactive API documentation

## 🔧 Troubleshooting

### Common Issues:

1. **Import Errors**: The service is designed to work even with missing components. Check the console output for which modules loaded successfully.

2. **Port Already in Use**: If port 8004 is busy, edit `.env` and change `PORT=8004` to another port.

3. **Database Connection**: The service will start even without a database connection. Database features will be disabled.

4. **OpenAI API**: Without a valid API key, AI features will be disabled but the service will still run.

### Debug Mode:

Set `DEBUG=true` in `.env` to see detailed logs.

## 📁 Project Structure

```
RAG-service/
├── app/
│   ├── main.py              # Main FastAPI application
│   ├── core/config.py       # Configuration
│   ├── utils/logger.py      # Logging utility
│   └── ...
├── .env                     # Environment variables
├── start_rag.py            # Startup script
├── test_rag_service.py     # Test script
└── requirements-simple.txt # Dependencies
```

## 🎯 Next Steps

1. Set up PostgreSQL database for full functionality
2. Add your OpenAI API key for AI features
3. Connect to your Gig and Review services
4. Test the vector search and RAG endpoints

The service is designed to be modular - it will work with basic functionality even if some components are missing.