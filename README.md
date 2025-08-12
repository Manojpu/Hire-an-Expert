
# Hire an Expert - Microservices Platform

A modern web-based platform to connect users with knowledgeable experts in specific domains (e.g., cars, phones, computers) for personalized advice. Built with a microservices architecture using an API Gateway for scalable, maintainable service management.

## 🏗️ Architecture

This platform uses a **microservices architecture** with an **API Gateway** as the single point of entry:

```
Frontend (Next.js) → API Gateway → [Auth | Gig | Booking | Payment | Message] Services
```

## 🔧 Tech Stack

### API Gateway
- **Technology**: Node.js + Express
- **Features**: Routing, Rate Limiting, Authentication, Socket.IO Proxy
- **Port**: 8000

### Microservices
| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| **Auth Service** | FastAPI + Firebase | 8001 | User authentication |
| **Gig Service** | FastAPI + PostgreSQL | 8002 | Job/gig management |
| **Booking Service** | FastAPI + PostgreSQL | 8003 | Booking management |
| **Payment Service** | FastAPI | 8004 | Payment processing |
| **Message Service** | Node.js + MongoDB + Socket.IO | 8005 | Real-time messaging |

### Frontend
- **Technology**: Next.js + TypeScript + Tailwind CSS
- **Port**: 3000

## ✨ Features

### Core Platform Features
- Expert profiles with experience and rates
- User login and booking system
- **Real-time messaging** with Socket.IO
- Secure payment gateway integration
- Admin panel for management
- Review and rating system

### API Gateway Features
- **Single Entry Point**: All requests go through port 8000
- **Service Discovery**: Automatic routing to appropriate services
- **Security**: Rate limiting, CORS, JWT validation
- **Real-time Communication**: Socket.IO proxy for messaging
- **Monitoring**: Request logging, health checks
- **Error Handling**: Service unavailability management

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/yourusername/hire-an-expert.git
cd hire-an-expert

# Start all services with Docker
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8000
# Health Check: http://localhost:8000/health
```

### Option 2: Development Mode
```bash
# 1. Start API Gateway
cd services/api-gateway
npm install
npm run dev

# 2. Start individual services (in separate terminals)
# Auth Service
cd services/auth-service
pipenv install
pipenv run python main.py

# Gig Service  
cd services/gig-service
pip install -r requirements.txt
python main.py

# Booking Service
cd services/booking-service
pip install -r requirements.txt
python main.py

# Payment Service
cd services/payment-service
pip install -r requirements.txt
python -m app.main

# Message Service
cd services/msg-service
npm install
npm start

# 3. Start Frontend
cd frontend
npm install
npm run dev
```

