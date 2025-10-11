# Review Service Docker Management

## Quick Start

Your review service is now fully containerized and ready to run! Here's how to manage it:

### 🚀 Start the Service

**Windows:**

```bash
./start-containers.bat
```

**Linux/Mac:**

```bash
chmod +x start-containers.sh
./start-containers.sh
```

### 🛑 Stop the Service

**Windows:**

```bash
./stop-containers.bat
```

**Linux/Mac:**

```bash
chmod +x stop-containers.sh
./stop-containers.sh
```

## Service URLs

Once running, your service will be available at:

- **API**: http://localhost:8005
- **Interactive Documentation**: http://localhost:8005/docs
- **Health Check**: http://localhost:8005/health
- **Database**: localhost:5435 (PostgreSQL)

## Container Details

### review-service

- **Port**: 8005
- **Environment**: Production-ready with environment variables
- **Auto-restart**: Enabled
- **Health checks**: Built-in

### review-db (PostgreSQL)

- **Port**: 5435 (external), 5432 (internal)
- **Database**: review_service
- **User**: review_user
- **Password**: review_pass_123
- **Persistent storage**: Docker volume `review-service_postgres_data`

## Database Management

### Connect to Database

```bash
docker exec -it review-db psql -U review_user -d review_service
```

### View Database Tables

```sql
\dt  -- List all tables
SELECT * FROM reviews LIMIT 5;  -- View sample reviews
```

### Run Migrations

Migrations are automatically run when the service starts, but you can also run them manually:

```bash
docker exec -it review-service alembic upgrade head
```

## Monitoring & Debugging

### View Logs

```bash
# Service logs
docker logs review-service -f

# Database logs
docker logs review-db -f
```

### Check Container Status

```bash
docker ps --filter "name=review-service" --filter "name=review-db"
```

### Access Container Shell

```bash
# Service container
docker exec -it review-service /bin/bash

# Database container
docker exec -it review-db /bin/bash
```

## API Endpoints

Your service includes these endpoints:

### Health & Info

- `GET /health` - Service health check
- `GET /` - Service info

### Review Operations

- `POST /reviews/` - Create a new review
- `GET /reviews/` - List reviews (with pagination/filtering)
- `GET /reviews/{review_id}` - Get specific review
- `PUT /reviews/{review_id}` - Update review
- `DELETE /reviews/{review_id}` - Delete review
- `GET /reviews/gig/{gig_id}` - Get reviews for a gig
- `GET /reviews/user/{user_id}` - Get reviews by user
- `GET /reviews/seller/{seller_id}` - Get reviews for seller
- `POST /reviews/{review_id}/helpful` - Mark review as helpful
- `DELETE /reviews/{review_id}/helpful` - Remove helpful mark
- `GET /reviews/{review_id}/helpful/count` - Get helpful count
- `GET /reviews/stats/gig/{gig_id}` - Get review statistics for gig

## Development

### Environment Variables

The service uses these environment variables:

```bash
DATABASE_URL=postgresql://review_user:review_pass_123@review-db:5432/review_service
INTERNAL_JWT_SECRET_KEY=docker-dev-secret-key
ALGORITHM=HS256
BOOKING_SERVICE_URL=http://booking-service:8003
GIG_SERVICE_URL=http://gig-service:8004
```

### Rebuild Service

If you make changes to the code:

```bash
# Stop containers
./stop-containers.bat

# Rebuild image
docker build -t review-service .

# Start containers
./start-containers.bat
```

## Troubleshooting

### Port Already in Use

If port 8005 or 5435 is already in use:

```bash
# Find what's using the port
netstat -ano | findstr :8005
# Or
lsof -i :8005

# Kill the process or change ports in docker run commands
```

### Database Connection Issues

```bash
# Test database connectivity
docker exec review-db pg_isready -U review_user -d review_service

# Check database logs
docker logs review-db
```

### Service Not Starting

```bash
# Check service logs
docker logs review-service

# Verify environment variables
docker exec review-service env | grep DATABASE_URL
```

## Clean Removal

To completely remove everything:

```bash
# Stop and remove containers
docker stop review-service review-db
docker rm review-service review-db

# Remove network and volumes
docker network rm review-network
docker volume rm review-service_postgres_data

# Remove image
docker rmi review-service
```

## Production Considerations

For production deployment:

1. **Change passwords** - Update database credentials
2. **Use secrets** - Store sensitive data in Docker secrets
3. **Add SSL/TLS** - Configure HTTPS
4. **Resource limits** - Set memory and CPU limits
5. **Monitoring** - Add proper logging and metrics
6. **Backup** - Set up database backups
7. **Load balancing** - Use multiple service instances

Your review service is now fully operational with Docker! 🎉
