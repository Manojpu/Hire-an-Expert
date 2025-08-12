# Hire an Expert - API Gateway Architecture

This project has been updated to use a microservices architecture with an API Gateway as the single point of entry for all client requests.

## Architecture Overview

```
Frontend (React/Next.js) → API Gateway → Microservices
                ↓
        [Auth, Gig, Booking, Payment, Message Services]
```

## Services & Ports

| Service | Port | Technology | Description |
|---------|------|------------|-------------|
| **API Gateway** | 8000 | Node.js/Express | Single entry point, routing, auth |
| **Auth Service** | 8001 | FastAPI/Python | User authentication with Firebase |
| **Gig Service** | 8002 | FastAPI/Python | Job/gig management |
| **Booking Service** | 8003 | FastAPI/Python | Booking management |
| **Payment Service** | 8004 | FastAPI/Python | Payment processing |
| **Message Service** | 8005 | Node.js/Express | Real-time messaging with Socket.IO |
| **Frontend** | 3000 | Next.js/React | User interface |

## API Gateway Features

### 🔒 Security
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet for security headers
- JWT token validation via Auth Service

### 📡 Routing
- **Auth**: `/api/auth/*` → Auth Service
- **Gigs**: `/api/gigs/*` → Gig Service  
- **Bookings**: `/api/bookings/*` → Booking Service
- **Payments**: `/api/payments/*` → Payment Service
- **Messages**: `/api/message/*` → Message Service
- **Conversations**: `/api/conversations/*` → Message Service

### 🚀 Real-time Communication
- Socket.IO proxy for real-time messaging
- Automatic reconnection handling
- Event forwarding between frontend and message service

### 📊 Monitoring
- Request/response logging
- Error tracking
- Health check endpoint (`/health`)
- Service availability monitoring

## Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# Start all services
docker-compose up --build

# Or start specific services
docker-compose up api-gateway auth-service message-service
```

### Option 2: Development Mode
```bash
# Install API Gateway dependencies
cd services/api-gateway
npm install

# Start API Gateway
npm run dev

# In separate terminals, start each service:
# Auth Service (Port 8001)
cd services/auth-service
pipenv install
pipenv run python main.py

# Gig Service (Port 8002)
cd services/gig-service
pip install -r requirements.txt
python main.py

# Booking Service (Port 8003)
cd services/booking-service
pip install -r requirements.txt
python main.py

# Payment Service (Port 8004)
cd services/payment-service
pip install -r requirements.txt
python -m app.main

# Message Service (Port 8005)
cd services/msg-service
npm install
npm start

# Frontend (Port 3000)
cd frontend
npm install
npm run dev
```

## Environment Configuration

### API Gateway (.env)
```bash
PORT=8000
NODE_ENV=development
AUTH_SERVICE_URL=http://localhost:8001
GIG_SERVICE_URL=http://localhost:8002
BOOKING_SERVICE_URL=http://localhost:8003
PAYMENT_SERVICE_URL=http://localhost:8004
MESSAGE_SERVICE_URL=http://localhost:8005
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_SECRET=your-super-secret-jwt-key
SOCKET_CORS_ORIGIN=http://localhost:3000
```

## API Usage Examples

### Authentication
```javascript
// Login
const response = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Use token in subsequent requests
const token = response.data.token;
fetch('http://localhost:8000/api/gigs', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Real-time Messaging
```javascript
import { io } from 'socket.io-client';

// Connect to API Gateway WebSocket
const socket = io('http://localhost:8000');

// Events are automatically forwarded to Message Service
socket.emit('joinRoom', conversationId);
socket.on('newMessage', (message) => {
  console.log('New message:', message);
});
```

## Frontend Integration

The frontend has been updated to use the API Gateway:

```typescript
// Before (Direct service calls)
const API_BASE_URL = 'http://localhost:5000/api';

// After (Through API Gateway)
const API_GATEWAY_URL = 'http://localhost:8000/api';

// All API calls now go through the gateway
messageAPI.getMessages(conversationId); // → /api/message/${conversationId}
authAPI.login(credentials);              // → /api/auth/login
gigAPI.getAllGigs();                     // → /api/gigs
```

## Service Communication

```
Frontend Request → API Gateway → Service
     ↓                ↓             ↓
   Response ← API Gateway ← Service Response
```

### Benefits
1. **Single Entry Point**: One URL for all API calls
2. **Service Discovery**: Gateway handles service locations
3. **Load Balancing**: Can distribute requests across service instances
4. **Authentication**: Centralized auth validation
5. **Rate Limiting**: Protect services from abuse
6. **Monitoring**: Centralized logging and metrics
7. **CORS**: Simplified frontend configuration

## Troubleshooting

### Health Checks
```bash
# Check API Gateway
curl http://localhost:8000/health

# Check individual services
curl http://localhost:8001/  # Auth Service
curl http://localhost:8002/  # Gig Service
curl http://localhost:8003/  # Booking Service
curl http://localhost:8004/  # Payment Service
curl http://localhost:8005/  # Message Service
```

### Common Issues
1. **Service Unavailable (503)**: Check if target service is running
2. **CORS Errors**: Verify FRONTEND_URL in gateway .env
3. **Socket.IO Issues**: Ensure message service Socket.IO accepts gateway connections
4. **Auth Errors**: Verify JWT token format and auth service connectivity

### Logs
```bash
# API Gateway logs
docker-compose logs api-gateway

# Service-specific logs
docker-compose logs auth-service
docker-compose logs message-service
```

## Development Guidelines

### Adding New Routes
1. Add route configuration in `server.js`
2. Update service URLs in `.env`
3. Add health checks for new services
4. Update this README

### Security Considerations
- Never expose service ports directly in production
- Use environment variables for sensitive data
- Implement proper JWT validation
- Monitor rate limiting logs
- Regular security updates

## Production Deployment

### Recommendations
1. Use a reverse proxy (nginx) in front of API Gateway
2. Implement service mesh for inter-service communication
3. Use container orchestration (Kubernetes)
4. Implement proper logging and monitoring
5. Use managed databases
6. Implement circuit breakers for resilience

### Environment Variables for Production
```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
RATE_LIMIT_MAX_REQUESTS=1000
# Use internal service URLs in production
AUTH_SERVICE_URL=http://auth-service:8001
```

This API Gateway architecture provides a solid foundation for scaling the Hire an Expert platform while maintaining clean separation of concerns between services.
