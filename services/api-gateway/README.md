# FastAPI API Gateway

A high-performance API Gateway built with FastAPI for the Hire an Expert microservices platform. This gateway serves as the single entry point for all client requests, routing them to appropriate microservices.

## 🏗️ How It Works

The API Gateway acts as a reverse proxy that:
1. **Receives requests** from the frontend application
2. **Validates authentication** using JWT tokens (except for auth routes)
3. **Routes requests** to the appropriate microservice
4. **Forwards responses** back to the client

```
Frontend → API Gateway → [Auth | Gig | Booking | Payment | Message | User | Review] Services
```

## 📋 Prerequisites

- **Python 3.8+** (recommended: Python 3.11+)
- **pip** package manager

## � New Developer?

**First time setting up?** Check out our [Developer Setup Guide](DEVELOPER_SETUP.md) for a quick step-by-step walkthrough!

## �🚀 Installation & Setup

### Option 1: Automated Setup (Recommended)

#### Windows
```bash
cd services/api-gateway
start.bat
```

#### Linux/macOS
```bash
cd services/api-gateway
chmod +x start.sh
./start.sh
```

### Option 2: Manual Setup

```bash
# 1. Navigate to API Gateway directory
cd services/api-gateway

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy and configure environment
copy .env.example .env
# Edit .env file with your service URLs

# 6. Start the server
python main.py
```

## ⚙️ Configuration

### 🆕 For New Developers

**IMPORTANT**: The `.env` file is not committed to git for security reasons. To set up your environment:

1. **Copy the example file**:
   ```bash
   # Windows
   copy .env.example .env
   
   # Linux/macOS  
   cp .env.example .env
   ```

2. **Update the values** in your new `.env` file with the correct service URLs for your environment

3. **Never commit** your `.env` file - it contains sensitive configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Application Settings
DEBUG=true
PORT=8000
FRONTEND_URL=http://localhost:3000

# Microservice URLs (update as needed)
AUTH_SERVICE_URL=http://localhost:8001
GIG_SERVICE_URL=http://localhost:8002
BOOKING_SERVICE_URL=http://localhost:8003
PAYMENT_SERVICE_URL=http://localhost:8004
MESSAGE_SERVICE_URL=http://localhost:8005
USER_SERVICE_V2_URL=http://localhost:8006
REVIEW_SERVICE_URL=http://localhost:8007
```

## 🐳 Docker Setup

### Build and Run
```bash
# Build the image
docker build -t api-gateway .

# Run the container
docker run -p 8000:8000 api-gateway

# Or use docker-compose
docker-compose up
```

### Docker Compose
```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🛣️ API Routes

| Route Pattern | Target Service | Auth Required |
|---------------|----------------|---------------|
| `/api/auth/*` | Auth Service | ❌ No |
| `/api/user-v2/*` | User Service V2 | ✅ Yes |
| `/api/gigs/*` | Gig Service | ✅ Yes |
| `/api/bookings/*` | Booking Service | ✅ Yes |
| `/api/payments/*` | Payment Service | ✅ Yes |
| `/api/message/*` | Message Service | ✅ Yes |
| `/api/conversations/*` | Message Service | ✅ Yes |
| `/api/reviews/*` | Review Service | ✅ Yes |
| `/health` | API Gateway | ❌ No |

## 🔧 Testing

### Quick Health Check
```bash
curl http://localhost:8000/health
```

### Run Test Suite
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx requests

# Run validation tests
python validate_gateway.py

# Run full test suite
python run_tests.py
```

## 🔍 Monitoring

### Service Status
```bash
python monitor.py
```

### View Logs
```bash
# Real-time logs
tail -f logs/api_gateway.log

# Recent logs
cat logs/api_gateway.log
```

## 🚦 Production Deployment

1. **Update environment variables** for production URLs
2. **Set `DEBUG=false`** in `.env`
3. **Use proper secrets** for authentication
4. **Ensure all microservices are running**
5. **Configure reverse proxy** (nginx/apache) if needed

## 🤝 Frontend Integration

Update your frontend to use the API Gateway:

```javascript
// API Base URL
const API_BASE_URL = 'http://localhost:8000/api';

// Example API calls
fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', ... });
fetch(`${API_BASE_URL}/gigs`, { 
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🆘 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :8000
# Linux/macOS  
lsof -ti:8000 | xargs kill -9
```

**Service unavailable (503):**
- Check if target microservice is running
- Verify service URLs in `.env`

**Authentication errors (401):**
- Ensure JWT token is valid
- Check auth service connectivity

---

**🎉 The API Gateway should now be running on `http://localhost:8000`**
