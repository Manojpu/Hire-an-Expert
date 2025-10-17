# API Gateway - Docker Setup

## Quick Start

### Start the API Gateway

```bash
docker-start.bat
```

This will:

1. Build the Docker image
2. Start the container
3. Show logs (you can Ctrl+C to exit, container keeps running)

### Stop the API Gateway

```bash
docker-stop.bat
```

### Restart the API Gateway

```bash
docker-restart.bat
```

Use this when you want to rebuild the image with dependency changes.

### View Logs

```bash
docker-logs.bat
```

### Access Container Shell

```bash
docker-shell.bat
```

## Development with Hot-Reload

✅ **Changes to `main.py` and `monitor.py` are automatically detected!**

The container is configured with:

- `--reload` flag in uvicorn
- Volume mounts for source code files
- `.env` file loaded automatically

### Making Changes

1. Edit `main.py` or `monitor.py`
2. Save the file
3. The container will automatically reload (check logs)
4. No need to restart the container!

### When to Restart

You only need to restart the container when:

- ❌ Adding new dependencies to `requirements.txt`
- ❌ Changing Dockerfile
- ❌ Changing docker-compose.yml
- ❌ Adding new Python files (not mounted)

For these changes, run: `docker-restart.bat`

## Environment Variables

The container loads environment variables from `.env` file:

```
ENVIRONMENT=development
DEBUG=true
PORT=8000
AUTH_SERVICE_URL=http://localhost:8001
GIG_SERVICE_URL=http://localhost:8002
...
```

**Note**: Service URLs are automatically overridden in docker-compose.yml to use `host.docker.internal` for accessing services running on host machine.

## Accessing the API

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Troubleshooting

### Container won't start

```bash
docker-compose logs
```

### Port 8000 already in use

Stop any other service using port 8000 or change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "8080:8000" # Changed from 8000:8000
```

### Hot-reload not working

Check that the volume mounts are correct:

```bash
docker-compose config
```

### Can't reach other services

Make sure other services (auth, gig, booking, etc.) are running on the host machine at their respective ports (8001, 8002, 8003, etc.)

## Docker Commands Reference

```bash
# Build image
docker-compose build

# Start container (detached)
docker-compose up -d

# Start container (with logs)
docker-compose up

# Stop container
docker-compose down

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec api-gateway <command>

# Rebuild and restart
docker-compose up -d --build
```
