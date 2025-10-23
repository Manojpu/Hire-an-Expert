# Review Service - Docker Setup

This guide will help you run the Review Service using Docker.

## 🐳 Prerequisites

- **Docker Desktop** - Download and install from [docker.com](https://www.docker.com/products/docker-desktop)
- **Docker Compose** - Included with Docker Desktop

## 🚀 Quick Start

### Option 1: Automated Setup (Windows)

```bash
# Run the setup script
./setup-docker.bat
```

### Option 2: Manual Setup

1. **Start Docker Desktop** (if not already running)

2. **Build and run the services:**

   ```bash
   docker-compose up --build -d
   ```

3. **Check service status:**
   ```bash
   docker-compose ps
   ```

## 📊 Services

The Docker Compose setup includes:

### Review Service API

- **Port:** 8005
- **Health Check:** http://localhost:8005/health
- **API Documentation:** http://localhost:8005/docs
- **ReDoc:** http://localhost:8005/redoc

### PostgreSQL Database

- **Port:** 5435 (mapped from internal 5432)
- **Database:** review_service
- **Username:** review_user
- **Password:** review_pass_123

## 🔧 Configuration

### Environment Variables

The service uses these environment variables (set in docker-compose.yml):

```yaml
DATABASE_URL: postgresql://review_user:review_pass_123@db:5432/review_service
INTERNAL_JWT_SECRET_KEY: docker-dev-secret-key-change-in-production
BOOKING_SERVICE_URL: http://booking-service:8003
GIG_SERVICE_URL: http://gig-service:8004
USER_SERVICE_URL: http://user-service:8006
```

### Custom Configuration

To use custom environment variables:

1. Copy the example file:

   ```bash
   cp .env.docker .env
   ```

2. Edit `.env` with your values

3. Update docker-compose.yml to use the env_file:
   ```yaml
   review-service:
     # ... other config
     env_file:
       - .env
   ```

## 📋 Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart review-service

# View logs
docker-compose logs -f review-service

# View all service logs
docker-compose logs -f
```

### Development Commands

```bash
# Rebuild and start (after code changes)
docker-compose up --build -d

# Access the container shell
docker-compose exec review-service /bin/bash

# Run database migrations manually
docker-compose exec review-service alembic upgrade head

# Check database
docker-compose exec db psql -U review_user -d review_service
```

### Debugging

```bash
# Check service health
curl http://localhost:8005/health

# View container status
docker-compose ps

# View resource usage
docker stats

# Check container logs for errors
docker-compose logs review-service | grep -i error
```

## 🗃️ Database Management

### Accessing the Database

```bash
# Connect via docker-compose
docker-compose exec db psql -U review_user -d review_service

# Connect from host (if you have psql installed)
psql -h localhost -p 5435 -U review_user -d review_service
```

### Database Migrations

Migrations run automatically when the container starts. To run them manually:

```bash
docker-compose exec review-service alembic upgrade head
```

### Backup and Restore

```bash
# Backup
docker-compose exec db pg_dump -U review_user review_service > backup.sql

# Restore
docker-compose exec -T db psql -U review_user review_service < backup.sql
```

## 🔍 Troubleshooting

### Service Won't Start

1. **Check Docker is running:**

   ```bash
   docker info
   ```

2. **Check logs for errors:**

   ```bash
   docker-compose logs review-service
   ```

3. **Verify database connection:**
   ```bash
   docker-compose logs db
   ```

### Port Conflicts

If ports 8005 or 5435 are in use, edit `docker-compose.yml`:

```yaml
services:
  review-service:
    ports:
      - "8006:8005" # Change external port

  db:
    ports:
      - "5436:5432" # Change external port
```

### Database Connection Issues

1. **Ensure database is healthy:**

   ```bash
   docker-compose ps
   ```

2. **Check database logs:**

   ```bash
   docker-compose logs db
   ```

3. **Restart database:**
   ```bash
   docker-compose restart db
   ```

### Performance Issues

1. **Check resource usage:**

   ```bash
   docker stats
   ```

2. **Increase Docker Desktop memory** (Settings > Resources > Memory)

3. **Clean up unused containers:**
   ```bash
   docker system prune
   ```

## 🧪 Testing the API

### Quick Health Check

```bash
curl http://localhost:8005/health
```

### Create a Test Review (requires authentication)

```bash
curl -X POST "http://localhost:8005/api/reviews/" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "gig_id": "test-gig-123",
       "booking_id": "test-booking-456",
       "rating": 5,
       "comment": "Great work!"
     }'
```

### Get Reviews for a Gig

```bash
curl "http://localhost:8005/api/reviews/gig/test-gig-123/reviews"
```

## 🚀 Production Deployment

For production deployment:

1. **Change default passwords** in docker-compose.yml
2. **Set secure JWT secret** in environment variables
3. **Configure proper CORS origins**
4. **Set up SSL/TLS termination**
5. **Configure logging and monitoring**
6. **Use Docker Swarm or Kubernetes** for orchestration

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
