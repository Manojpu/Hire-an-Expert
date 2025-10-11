# Service Port Configuration

## ✅ Current Running Services:

### **API Gateway - Port 8000**
- URL: `http://localhost:8000`
- Status: ✅ Running
- Purpose: Central entry point for all API requests
- Routes:
  - `/api/message/*` → Message Service (port 8005)
  - `/api/conversations/*` → Message Service (port 8005)
  - `/api/auth/*` → Auth Service (port 8001)
  - And other microservices...

### **Message Service - Port 8005**
- URL: `http://localhost:8005` 
- Status: ✅ Running
- Purpose: Real-time messaging with Socket.IO
- Direct access for Socket.IO connections
- API access through API Gateway

### **Frontend - Port 3000**
- URL: `http://localhost:3000`
- Status: ✅ Running  
- Purpose: React frontend application
- Configured to use API Gateway for HTTP requests
- Direct Socket.IO connection to Message Service

## 🔄 Communication Flow:

```
Frontend (3000) 
    ↓ HTTP API calls
API Gateway (8000)
    ↓ proxies to  
Message Service (8005)

Frontend (3000)
    ↓ Socket.IO (real-time)
Message Service (8005)
```

## 📡 Updated Configurations:

### Frontend (`messageService.ts`):
- **HTTP requests**: `http://localhost:8000` (API Gateway)
- **Socket.IO**: `http://localhost:8005` (Direct to Message Service)

### API Gateway (`main.py`):
- **Frontend CORS**: `http://localhost:3000`
- **Message Service proxy**: `http://localhost:8005`

### Message Service (`server.js`):
- **Socket.IO CORS**: Includes `http://localhost:3000`
- **Port**: 8005

## 🧪 How to Test:

1. **Visit**: `http://localhost:3000`
2. **Login** to your account
3. **Click the message icon** (💬) in navigation
4. **Verify**:
   - API calls go through API Gateway (8000)
   - Socket.IO connects directly (8005)
   - Real-time messaging works
   - CORS is properly configured

## 🚀 All Systems Ready!

The messaging system is now properly integrated with the API Gateway architecture!
