"""
Simple FastAPI API Gateway for Hire an Expert microservices
Compatible with older FastAPI/Pydantic versions
"""
import os
import time
import logging
import asyncio
from datetime import datetime
from typing import Optional

import uvicorn
import httpx
from starlette.applications import Starlette
from starlette.routing import Route, Mount
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("api_gateway")

# Create logs directory
os.makedirs("logs", exist_ok=True)

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configuration
class Config:
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    PORT = int(os.getenv("PORT", "8000"))
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    # Additional CORS origins for development
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
        "http://localhost:4173",  # Vite preview
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://addwise.s3-website-ap-southeast-2.amazonaws.com"
    ]
    
    # Service URLs
    AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")
    GIG_SERVICE_URL = os.getenv("GIG_SERVICE_URL", "http://localhost:8002")
    BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://localhost:8003")
    PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://localhost:8004")
    MESSAGE_SERVICE_URL = os.getenv("MESSAGE_SERVICE_URL", "http://localhost:8005")
    USER_SERVICE_V2_URL = os.getenv("USER_SERVICE_V2_URL", "http://localhost:8006")
    REVIEW_SERVICE_URL = os.getenv("REVIEW_SERVICE_URL", "http://localhost:8007")
    ADMIN_SERVICE_URL = os.getenv("ADMIN_SERVICE_URL", "http://localhost:8009")
    NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://localhost:8008")
    MEETING_SERVICE_URL = os.getenv("MEETING_SERVICE_URL", "http://localhost:8010")
    
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))

config = Config()

# HTTP client for proxy requests
client = httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT)

# Service mapping
services = {
    "auth": config.AUTH_SERVICE_URL,
    "gig": config.GIG_SERVICE_URL,
    "booking": config.BOOKING_SERVICE_URL,
    "payment": config.PAYMENT_SERVICE_URL,
    "message": config.MESSAGE_SERVICE_URL,
    "user_v2": config.USER_SERVICE_V2_URL,
    "review": config.REVIEW_SERVICE_URL,
    "admin": config.ADMIN_SERVICE_URL,
}

# Store startup time
startup_time = time.time()

# Authentication helper
async def verify_auth_token(authorization: Optional[str] = None):
    """Verify JWT token with auth service"""
    if not authorization:
        return None
    
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    try:
        response = await client.post(
            f"{config.AUTH_SERVICE_URL}/ping",
            headers={"authorization": token},
            json={},
            timeout=5
        )
        if response.status_code == 200:
            # Handle both real and mocked responses properly
            try:
                response_data = response.json()
                # Handle mock responses that return coroutines
                if asyncio.iscoroutine(response_data):
                    response_data = await response_data
                
                if isinstance(response_data, dict):
                    return {"user_id": str(response_data.get("user_id", response_data.get("id", "unknown")))}
                else:
                    return {"user_id": str(response_data)}
            except Exception as json_error:
                logger.error(f"Error parsing auth response: {json_error}")
                return None
        else:
            return None
    except Exception as e:
        logger.error(f"Auth verification failed: {e}")
        return None

# Proxy helper
async def proxy_request(request: Request, service_url: str, target_path: str, auth_required: bool = True):
    """Proxy request to target service"""
    
    # Authentication check
    if auth_required:
        auth_header = request.headers.get("authorization")
        if not auth_header:
            return JSONResponse({"error": "Authentication required"}, status_code=401)
        
        user = await verify_auth_token(auth_header)
        if not user:
            return JSONResponse({"error": "Invalid or expired token"}, status_code=401)
    
    # Build target URL
    url = f"{service_url.rstrip('/')}{target_path}"
    if request.query_params:
        url += f"?{request.query_params}"
    
    # Prepare headers
    headers = {}
    for name, value in request.headers.items():
        if name.lower() not in ["host", "content-length"]:
            headers[name] = value
    
    # Get body
    body = await request.body()
    
    try:
        # Make request
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body
        )
        
        # Prepare response headers
        response_headers = {}
        for name, value in response.headers.items():
            if name.lower() not in ["content-length", "transfer-encoding", "connection"]:
                response_headers[name] = value
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers
        )
        
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        return JSONResponse({"error": "Service unavailable"}, status_code=503)

# Route handlers
async def health_check(request):
    """Health check endpoint"""
    return JSONResponse({
        "status": "OK",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": time.time() - startup_time,
        "services": services
    })

# Dynamic proxy handlers
async def proxy_auth(request):
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["auth"], f"/{path}", auth_required=False)

async def proxy_user_v2(request):
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["user_v2"], f"/{path}")

async def proxy_users_legacy(request):
    """Legacy /users route - redirects to user-v2 service"""
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["user_v2"], f"/users/{path}", auth_required=False)

async def proxy_user_v2_admin(request):
    """Proxy for user admin endpoints - route to regular user endpoints as fallback"""
    path = request.path_params.get("path", "")
    
    # For verification documents and verify-as-expert, always use admin route
    if "verification-documents" in path or "verify-as-expert" in path:
        return await proxy_request(request, services["user_v2"], f"/admin/{path}", auth_required=False)
    
    # For user details (but not verification-related), route to regular user endpoint
    if path.startswith("users/") and "verification" not in path and "verify" not in path:
        user_id = path.replace("users/", "")
        return await proxy_request(request, services["user_v2"], f"/users/{user_id}", auth_required=False)
    
    # For other admin endpoints, use admin route
    return await proxy_request(request, services["user_v2"], f"/admin/{path}", auth_required=False)

async def proxy_gigs(request):
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["gig"], f"/gigs/{path}", auth_required=False)

async def proxy_gigs_admin(request):
    """Proxy for gig admin endpoints - authentication handled by gig service"""
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["gig"], f"/gigs/admin/{path}", auth_required=False)

async def proxy_bookings(request):
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["booking"], f"/bookings/{path}")

async def proxy_categories(request):
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["gig"], f"/categories/{path}", auth_required=False)

async def proxy_payments(request):
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["payment"], f"/payments/{path}")

async def proxy_messages(request):
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["message"], f"/api/message/{path}", auth_required=False)

async def proxy_conversations(request):
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["message"], f"/api/conversations/{path}", auth_required=False)

async def proxy_upload(request):
    """Proxy for file upload endpoints - message service"""
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["message"], f"/api/upload/{path}", auth_required=False)

async def proxy_rag(request):
    """Proxy for RAG/AI Chat endpoints - admin service"""
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["admin"], f"/api/rag/{path}", auth_required=False)

async def rag_health_check(request):
    """Check RAG system health through admin service"""
    try:
        response = await client.get(
            f"{services['admin']}/health",
            timeout=5
        )
        
        if response.status_code == 200:
            admin_health = response.json()
            return JSONResponse({
                "status": "healthy",
                "service": "rag-system",
                "admin_service": admin_health,
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            return JSONResponse({
                "status": "unhealthy",
                "service": "rag-system",
                "error": f"Admin service returned status {response.status_code}",
                "timestamp": datetime.utcnow().isoformat()
            }, status_code=503)
            
    except httpx.TimeoutException:
        return JSONResponse({
            "status": "unhealthy",
            "service": "rag-system",
            "error": "Admin service timeout",
            "timestamp": datetime.utcnow().isoformat()
        }, status_code=503)
    except Exception as e:
        logger.error(f"RAG health check error: {e}")
        return JSONResponse({
            "status": "unhealthy",
            "service": "rag-system",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }, status_code=503)

async def proxy_reviews(request):
    path = request.path_params.get("path", "")
    return await proxy_request(request, services["review"], f"/reviews/{path}", auth_required=False)

async def catch_all(request):
    """404 handler"""
    return JSONResponse({"error": f"Route {request.url.path} not found"}, status_code=404)

# Request logging middleware
class LoggingMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            start_time = time.time()
            request = Request(scope, receive)
            logger.info(f"{request.method} {request.url.path}")
            
            async def log_response(message):
                if message["type"] == "http.response.start":
                    process_time = time.time() - start_time
                    status_code = message["status"]
                    logger.info(f"Completed {request.method} {request.url.path} - {status_code} - {process_time:.3f}s")
                await send(message)
            
            await self.app(scope, receive, log_response)
        else:
            await self.app(scope, receive, send)

# Routes
routes = [
    Route("/health", health_check, methods=["GET"]),
    Route("/api/rag/health", rag_health_check, methods=["GET"]),
    Route("/api/auth/{path:path}", proxy_auth, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/user-v2/admin/{path:path}", proxy_user_v2_admin, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/user-v2/{path:path}", proxy_user_v2, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/users/{path:path}", proxy_users_legacy, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/gigs/admin/{path:path}", proxy_gigs_admin, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/gigs/{path:path}", proxy_gigs, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/categories/{path:path}", proxy_categories, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/bookings/{path:path}", proxy_bookings, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/payments/{path:path}", proxy_payments, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/message/{path:path}", proxy_messages, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/conversations/{path:path}", proxy_conversations, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/upload/{path:path}", proxy_upload, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/reviews/{path:path}", proxy_reviews, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/api/rag/{path:path}", proxy_rag, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
    Route("/{path:path}", catch_all, methods=["GET", "POST", "PUT", "DELETE", "PATCH"]),
]

# Middleware
middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=config.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ),
    Middleware(LoggingMiddleware),
]

# Create Starlette app
app = Starlette(routes=routes, middleware=middleware)

# Lifecycle events
@app.on_event("startup")
async def startup():
    logger.info("🚀 FastAPI API Gateway starting up...")
    logger.info(f"📊 Environment: {'development' if config.DEBUG else 'production'}")
    logger.info(f"🌐 Frontend URL: {config.FRONTEND_URL}")
    logger.info("📡 Service Routes:")
    for name, url in services.items():
        logger.info(f"   {name}: {url}")

@app.on_event("shutdown")
async def shutdown():
    logger.info("👋 API Gateway shutting down...")
    await client.aclose()

if __name__ == "__main__":
    logger.info("🚀 Starting FastAPI API Gateway...")
    logger.info(f"📊 Environment: {'development' if config.DEBUG else 'production'}")
    logger.info(f"🌐 Frontend URL: {config.FRONTEND_URL}")
    logger.info("📡 Service Routes:")
    for name, url in services.items():
        logger.info(f"   {name}: {url}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=config.PORT,
        reload=config.DEBUG,
        log_level="info"
    )
