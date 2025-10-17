# 🐳 Admin Service - Docker Setup Guide

## Quick Start

### 1️⃣ Prerequisites

- Docker Desktop installed and running
- `.env` file configured (copy from `.env.example`)

### 2️⃣ Complete Setup (From Scratch)

Run the automated setup script:

```bash
BUILD-AND-RUN.bat
```

This will:

1. ✅ Stop and remove any existing containers
2. ✅ Build the Docker image from scratch
3. ✅ Start the container in detached mode
4. ✅ Display container status

**Build time**: First build takes ~5-10 minutes (downloads dependencies)

---

## 📋 Management Commands

### Start/Stop/Restart

```bash
# Start the container
docker-start.bat

# Stop the container
docker-stop.bat

# Restart the container
docker-restart.bat
```

### Logs & Debugging

```bash
# View live logs (Ctrl+C to exit)
docker-logs.bat

# Access container shell
docker-shell.bat
```

### Manual Docker Commands

```bash
# Build image
docker-compose build

# Start container (detached)
docker-compose up -d

# Start and view logs
docker-compose up

# Stop container
docker-compose stop

# Remove container and networks
docker-compose down

# Rebuild without cache
docker-compose build --no-cache
```

---

## 🔥 Hot-Reload Feature

**Auto-reload is ENABLED!** Changes to the following files will automatically restart the server:

✅ **Mounted files** (auto-reload):

- `main.py` - Application entry point
- `app/` directory - All Python modules
  - `app/rag/` - RAG components
  - `app/routes/` - API routes
  - `app/database/` - Database modules
  - `app/config.py` - Configuration

📦 **Container files** (need rebuild):

- `requirements.txt` - Python dependencies
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Service configuration

### How It Works

The `--reload` flag in uvicorn watches mounted files and automatically restarts the server when changes are detected.

---

## 🔄 When to Rebuild

### ✅ Auto-Reload (No rebuild needed)

- Editing Python code in `main.py`
- Editing files in `app/` directory
- Changing business logic, routes, or configurations

### 🔨 Manual Rebuild Required

If you modify:

- `requirements.txt` (add/remove packages)
- `Dockerfile` (change build steps)
- Environment variables in `docker-compose.yml`

**Rebuild command:**

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

Or simply run:

```bash
BUILD-AND-RUN.bat
```

---

## 🌐 Service URLs

After starting the container, access:

- **API Base**: http://localhost:8009
- **Health Check**: http://localhost:8009/health
- **API Documentation**: http://localhost:8009/docs
- **Alternative Docs**: http://localhost:8009/redoc

---

## 📁 Volume Mounts

The following directories are mounted for persistence:

| Host Path   | Container Path | Purpose                  |
| ----------- | -------------- | ------------------------ |
| `./main.py` | `/app/main.py` | Hot-reload for main file |
| `./app`     | `/app/app`     | Hot-reload for app code  |
| `./data`    | `/app/data`    | FAISS index storage      |
| `./uploads` | `/app/uploads` | Uploaded documents       |
| `./logs`    | `/app/logs`    | Application logs         |

---

## 🔍 Health Check

The container includes automatic health checks:

```bash
# Manual health check
curl http://localhost:8009/health
```

Expected response:

```json
{
  "status": "healthy",
  "database": "connected",
  "vector_store": "initialized",
  "rag_engine": "ready"
}
```

---

## ⚙️ Environment Variables

Required variables (configure in `.env`):

### Application

- `DEBUG` - Enable debug mode (default: false)
- `HOST` - Host address (default: 0.0.0.0)
- `PORT` - Service port (default: 8009)
- `SERVICE_NAME` - Service identifier

### Database

- `MONGO_URI` - MongoDB connection string
- `MONGO_DB_NAME` - Database name

### Google Gemini AI

- `GOOGLE_API_KEY` - Your Gemini API key (required!)
- `GEMINI_MODEL` - Model to use (default: gemini-2.5-flash)

### RAG Configuration

- `CHUNK_SIZE` - Document chunk size (default: 1000)
- `CHUNK_OVERLAP` - Overlap between chunks (default: 200)
- `TOP_K_RESULTS` - Number of results to retrieve (default: 5)
- `EMBEDDING_MODEL` - Model for embeddings (default: all-MiniLM-L6-v2)

### Vector Store

- `FAISS_INDEX_PATH` - Path to FAISS index
- `VECTOR_DIMENSION` - Embedding dimension (default: 384)

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check if port 8009 is already in use
netstat -ano | findstr :8009

# View detailed logs
docker-compose logs -f

# Check container status
docker ps -a
```

### MongoDB connection issues

- Ensure MongoDB is running and accessible
- Check `MONGO_URI` in `.env` file
- If MongoDB is on host machine, use `host.docker.internal` instead of `localhost`

Example for host MongoDB:

```
MONGO_URI=mongodb://host.docker.internal:27017/
```

### Hot-reload not working

- Ensure files are saved before expecting reload
- Check if files are properly mounted:
  ```bash
  docker exec -it admin-service ls -la /app/
  ```
- View logs to see reload messages:
  ```bash
  docker-compose logs -f
  ```

### Image size too large

- Current Dockerfile uses multi-stage build and CPU-only PyTorch
- Expected size: ~1.5-2GB (much smaller than GPU version ~7GB)
- To reduce further, remove unused dependencies from `requirements.txt`

### Need to rebuild from scratch

```bash
# Complete reset
docker-compose down -v
docker system prune -a
BUILD-AND-RUN.bat
```

---

## 🏗️ Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build to minimize image size:

1. **Builder stage**: Installs all dependencies
2. **Runtime stage**: Copies only necessary files

### CPU-Only PyTorch

- Uses `torch==2.8.0` with CPU index
- Prevents CUDA packages download (~5GB saved)
- Perfect for production without GPU

### Network Configuration

- Uses `hire-expert-network` external network
- Allows communication with other services (api-gateway, etc.)

---

## 📦 Container Details

- **Base Image**: `python:3.11-slim`
- **Working Directory**: `/app`
- **Exposed Port**: `8009`
- **User**: Non-root user for security
- **Restart Policy**: `unless-stopped`

---

## 🚀 Production Tips

1. **Use production MongoDB**

   - Don't use localhost, use proper connection string
   - Enable authentication

2. **Secure API keys**

   - Never commit `.env` file
   - Use secrets management in production

3. **Monitor logs**

   - Set up log aggregation
   - Monitor `./logs` directory

4. **Scale if needed**

   - Adjust `MAX_WORKERS` in `.env`
   - Consider running multiple containers with load balancer

5. **Backup data**
   - Regularly backup `./data` (FAISS index)
   - Backup `./uploads` directory
   - Backup MongoDB database

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Google Gemini API](https://ai.google.dev/)
- [FAISS Documentation](https://github.com/facebookresearch/faiss)

---

## 💡 Tips

- **First run**: Build takes time, be patient
- **Development**: Hot-reload makes development faster
- **Production**: Disable debug mode and hot-reload
- **Monitoring**: Check `/health` endpoint regularly
- **Logs**: Always check logs when debugging issues

---

**Need help?** Check the main README.md or RUNNING_THE_PROJECT.md
