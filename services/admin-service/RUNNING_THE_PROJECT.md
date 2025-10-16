# 🚀 How to Run the Admin Service

Complete guide for running the Admin Service RAG system using Docker or Python virtual environment.

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Method 1: Run with Docker (Recommended)](#method-1-run-with-docker-recommended)
- [Method 2: Run with Python venv](#method-2-run-with-python-venv)
- [Testing the Service](#testing-the-service)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Python** | 3.11+ | Runtime environment |
| **Docker** | 20.10+ | Container runtime (Docker method) |
| **MongoDB** | 5.0+ | Vector storage database |
| **Git** | 2.0+ | Clone repository |

### Check Installations

```powershell
# Check Python version
python --version
# Expected: Python 3.11.x or higher

# Check Docker version
docker --version
# Expected: Docker version 20.10.x or higher

# Check MongoDB is running
# If using Docker MongoDB:
docker ps | findstr mongo
# If using local MongoDB:
mongo --version
```

---

## Method 1: Run with Docker (Recommended)

### 🎯 Why Docker?
- ✅ No dependency conflicts
- ✅ Isolated environment
- ✅ Production-ready
- ✅ Easy deployment
- ✅ CPU-optimized (2.5GB image)

### Step 1: Navigate to Project Directory

```powershell
cd D:\Projects\Hire-an-Expert\services\admin-service
```

### Step 2: Configure Environment Variables

```powershell
# Copy example environment file
Copy-Item .env.example .env

# Edit .env file (use your preferred editor)
notepad .env
```

**Required Environment Variables:**
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=hire_expert

# Service Configuration
PORT=8009
HOST=0.0.0.0

# Optional: API Keys
OPENAI_API_KEY=your_openai_key_here
```

### Step 3: Build Docker Image

```powershell
# Build the optimized image (CPU-only, ~2.5GB)
docker build -t admin-service .

# Check image size
docker images admin-service
# Expected output:
# REPOSITORY       TAG       SIZE
# admin-service    latest    ~2.5GB
```

**Build Time:** ~10-15 minutes (first time)

### Step 4: Run Docker Container

```powershell
# Run the container
docker run -d `
  --name admin-service `
  -p 8009:8009 `
  --env-file .env `
  admin-service

# Alternative: Run with MongoDB network (if MongoDB in Docker)
docker run -d `
  --name admin-service `
  -p 8009:8009 `
  --env-file .env `
  --network hire-expert-network `
  admin-service
```

**Flags Explained:**
- `-d` = Run in background (detached mode)
- `--name admin-service` = Container name
- `-p 8009:8009` = Port mapping (host:container)
- `--env-file .env` = Load environment variables
- `--network` = Connect to MongoDB network

### Step 5: Verify Container is Running

```powershell
# Check container status
docker ps | findstr admin-service

# Check container logs
docker logs admin-service

# Follow logs in real-time
docker logs -f admin-service
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8009
Loaded 13 vectors from MongoDB GridFS
```

### Step 6: Access the Service

Open your browser:
- **API Documentation**: http://localhost:8009/docs
- **Health Check**: http://localhost:8009/health
- **Alternative Docs**: http://localhost:8009/redoc

### Docker Management Commands

```powershell
# Stop the container
docker stop admin-service

# Start the container
docker start admin-service

# Restart the container
docker restart admin-service

# Remove the container
docker rm -f admin-service

# View logs
docker logs admin-service

# Execute commands inside container
docker exec -it admin-service python -c "import torch; print(torch.__version__)"

# Access container shell
docker exec -it admin-service /bin/bash
```

---

## Method 2: Run with Python venv

### 🎯 Why venv?
- ✅ Faster development
- ✅ Direct debugging
- ✅ Easy code changes
- ✅ Lower resource usage

### Step 1: Navigate to Project Directory

```powershell
cd D:\Projects\Hire-an-Expert\services\admin-service
```

### Step 2: Create Virtual Environment

```powershell
# Create venv (if not exists)
python -m venv venv

# Check venv created
Test-Path .\venv
# Expected: True
```

### Step 3: Activate Virtual Environment

```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Your prompt should change to:
# (venv) PS D:\Projects\Hire-an-Expert\services\admin-service>
```

**If activation fails (execution policy):**
```powershell
# Enable script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try activation again
.\venv\Scripts\Activate.ps1
```

### Step 4: Install Dependencies

```powershell
# Upgrade pip first
python -m pip install --upgrade pip

# Install CPU-only PyTorch FIRST
pip install torch==2.8.0 --index-url https://download.pytorch.org/whl/cpu

# Install all other packages
pip install -r requirements.txt

# Verify installations
pip list
```

**Expected Output:**
```
Package                Version
---------------------- ------------
torch                  2.8.0+cpu
faiss-cpu              1.12.0
sentence-transformers  5.1.1
fastapi                0.119.0
... (60+ packages)
```

### Step 5: Configure Environment Variables

```powershell
# Copy example environment file
Copy-Item .env.example .env

# Edit .env file
notepad .env
```

**Required Settings:**
```env
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=hire_expert
PORT=8009
HOST=127.0.0.1
```

### Step 6: Start MongoDB

```powershell
# Option A: MongoDB in Docker
docker run -d `
  --name mongodb `
  -p 27017:27017 `
  mongo:latest

# Option B: MongoDB installed locally
# Start MongoDB service (Windows Service)
net start MongoDB
```

### Step 7: Run the Application

```powershell
# Make sure venv is activated!
# (venv) PS D:\...\admin-service>

# Run with Uvicorn
python -m uvicorn main:app --host 127.0.0.1 --port 8009 --reload

# Alternative: Run main.py directly
python main.py
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8009 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
Loaded 13 vectors from MongoDB GridFS
```

### Step 8: Access the Service

Open your browser:
- **API Documentation**: http://localhost:8009/docs
- **Health Check**: http://localhost:8009/health

### venv Management Commands

```powershell
# Deactivate venv
deactivate

# Reactivate venv
.\venv\Scripts\Activate.ps1

# Update a package
pip install --upgrade fastapi

# Check installed packages
pip list

# Freeze requirements
pip freeze > requirements_frozen.txt

# Remove venv (if needed)
deactivate
Remove-Item -Recurse -Force .\venv
```

---

## Testing the Service

### Quick Health Check

```powershell
# Check service is running
curl http://localhost:8009/health

# Expected Response:
# {"status": "healthy", "service": "admin-service"}
```

### Test RAG Search

```powershell
# Using PowerShell Invoke-RestMethod
$body = @{
    query = "What services are available?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8009/api/v1/admin/search" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### Test File Upload

```powershell
# Create test document
"Test content for RAG system" | Out-File -FilePath test.txt

# Upload via curl (if installed)
curl -X POST "http://localhost:8009/api/v1/admin/upload" `
  -F "files=@test.txt"
```

### View API Documentation

Open in browser:
```
http://localhost:8009/docs
```

Interactive API testing available at Swagger UI!

---

## Troubleshooting

### Docker Issues

#### ❌ "docker: command not found"
```powershell
# Install Docker Desktop for Windows
# Download from: https://www.docker.com/products/docker-desktop
```

#### ❌ Container exits immediately
```powershell
# Check logs for errors
docker logs admin-service

# Common issues:
# 1. MongoDB not accessible
# 2. Port 8009 already in use
# 3. Environment variables missing

# Check if port is in use
netstat -ano | findstr :8009

# Kill process on port 8009
# Find PID from above command, then:
taskkill /PID <PID> /F
```

#### ❌ "Cannot connect to MongoDB"
```powershell
# Check MongoDB is running
docker ps | findstr mongo

# Start MongoDB if not running
docker start mongodb

# Check MongoDB logs
docker logs mongodb
```

#### ❌ Image too large (>3GB)
```powershell
# Rebuild with --no-cache
docker build --no-cache -t admin-service .

# Verify PyTorch is CPU-only
docker run --rm admin-service python -c "import torch; print(torch.__version__)"
# Expected: 2.8.0+cpu (not 2.8.0+cu121)
```

### venv Issues

#### ❌ "cannot be loaded because running scripts is disabled"
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate venv again
.\venv\Scripts\Activate.ps1
```

#### ❌ "pip: command not found"
```powershell
# Use python -m pip instead
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

#### ❌ PyTorch installs CUDA version (large download)
```powershell
# Uninstall existing PyTorch
pip uninstall torch

# Install CPU-only version explicitly
pip install torch==2.8.0 --index-url https://download.pytorch.org/whl/cpu

# Verify CPU-only
python -c "import torch; print(torch.__version__); print(f'CUDA: {torch.cuda.is_available()}')"
# Expected: 2.8.0+cpu, CUDA: False
```

#### ❌ "ModuleNotFoundError"
```powershell
# Ensure venv is activated
.\venv\Scripts\Activate.ps1

# Reinstall requirements
pip install -r requirements.txt

# Check package is installed
pip show <package-name>
```

#### ❌ "Address already in use" (Port 8009)
```powershell
# Find process using port 8009
netstat -ano | findstr :8009

# Kill the process
taskkill /PID <PID> /F

# Or use different port
python -m uvicorn main:app --host 127.0.0.1 --port 8010
```

### MongoDB Issues

#### ❌ "Connection refused to MongoDB"
```powershell
# Check MongoDB is running
docker ps | findstr mongo

# Start MongoDB
docker start mongodb

# Check connection
mongosh --eval "db.adminCommand('ping')"
```

#### ❌ "Authentication failed"
```powershell
# Update .env with correct credentials
MONGODB_URI=mongodb://username:password@localhost:27017/

# Or use MongoDB without auth (development only)
MONGODB_URI=mongodb://localhost:27017/
```

### Performance Issues

#### 🐢 Slow startup
```powershell
# Normal first-time startup: ~30 seconds
# - Loading ML models
# - Connecting to MongoDB
# - Loading vectors from GridFS

# Check logs to see progress
docker logs -f admin-service
```

#### 🐢 High memory usage
```powershell
# Docker: Limit container memory
docker run -d `
  --name admin-service `
  -p 8009:8009 `
  --memory="2g" `
  --env-file .env `
  admin-service

# venv: Check Python memory
# Open Task Manager > Details > python.exe
```

---

## Quick Reference

### Docker Commands
```powershell
# Build
docker build -t admin-service .

# Run
docker run -d --name admin-service -p 8009:8009 --env-file .env admin-service

# Logs
docker logs -f admin-service

# Stop
docker stop admin-service

# Remove
docker rm -f admin-service
```

### venv Commands
```powershell
# Create
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Install
pip install torch==2.8.0 --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Run
python -m uvicorn main:app --host 127.0.0.1 --port 8009 --reload

# Deactivate
deactivate
```

### Service URLs
- API Docs: http://localhost:8009/docs
- Health: http://localhost:8009/health
- ReDoc: http://localhost:8009/redoc

---

## 📊 Comparison: Docker vs venv

| Feature | Docker | venv |
|---------|--------|------|
| **Setup Time** | 15 min (first time) | 5 min |
| **Disk Space** | ~2.5GB | ~2GB |
| **Isolation** | ✅ Complete | ⚠️ Partial |
| **Production Ready** | ✅ Yes | ❌ No |
| **Development** | ⚠️ Slower rebuild | ✅ Fast iteration |
| **Debugging** | ⚠️ Extra steps | ✅ Direct |
| **Deployment** | ✅ Easy | ⚠️ Complex |

**Recommendation:**
- **Development**: Use venv for fast iteration
- **Testing/Production**: Use Docker for consistency

---

## 🎯 Success Indicators

### Service is Running Correctly When:

✅ Container/process starts without errors  
✅ Logs show: `Application startup complete`  
✅ Logs show: `Loaded X vectors from MongoDB GridFS`  
✅ Health endpoint returns: `{"status": "healthy"}`  
✅ API docs accessible at http://localhost:8009/docs  
✅ No error messages in logs  
✅ MongoDB connection successful  

### Example Healthy Logs:
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
Loading FAISS index from MongoDB GridFS...
Loaded 13 vectors from MongoDB GridFS
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8009 (Press CTRL+C to quit)
```

---

## Additional Resources

- **Main README**: `../README.md` - Project overview
- **Docker Strategy**: `./DOCKER_CPU_STRATEGY.md` - CPU optimization details
- **RAG System**: `../../RAG_SYSTEM_README.md` - RAG implementation
- **API Guide**: `../../QUICK_API_GUIDE.md` - API usage examples

---

**Last Updated:** October 16, 2025  
**Status:** Production Ready ✅  
**Tested On:** Windows 11, Docker 24.x, Python 3.11
