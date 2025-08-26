# Message Service

A dockerized Node.js service for handling real-time messaging using MongoDB Atlas.

## Features

- Real-time messaging with Socket.IO
- MongoDB Atlas cloud database integration
- Dockerized for easy deployment
- Health check endpoints
- CORS configuration for multiple origins

## Setup

### Prerequisites

1. Node.js 18+
2. Docker and Docker Compose
3. MongoDB Atlas account and cluster

### Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your MongoDB Atlas credentials:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   ```

### Running with Docker

1. Build and run the service:
   ```bash
   docker-compose up --build
   ```

2. The service will be available at `http://localhost:8005`

### Running without Docker

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/message` - Send a message
- `GET /api/conversations` - Get conversations

## MongoDB Atlas Benefits

- **Global Accessibility**: Database accessible from anywhere
- **Automatic Scaling**: Handles traffic spikes automatically
- **Built-in Security**: Enterprise-grade security features
- **Backup & Recovery**: Automated backups and point-in-time recovery
- **Monitoring**: Built-in performance monitoring and alerting

## Health Checks

The service includes Docker health checks that verify:
- Service is responding on port 8005
- Health endpoint returns successful status
- Database connection is working

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8005 |
| `MONGO_URI` | MongoDB Atlas connection string | Required |
| `CORS_ORIGINS` | Comma-separated allowed origins | http://localhost:3000 |
| `NODE_ENV` | Environment mode | development |
