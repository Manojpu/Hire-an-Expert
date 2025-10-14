from fastapi import FastAPI, HTTPException
import threading
import uvicorn
from consumer import HANDLERS, start_consuming
import logging
from typing import Dict, Any


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Notification Service", description="Service for handling notifications in the Hire-an-Expert platform")

# Flag to track if RabbitMQ consumer is running
consumer_thread = None

@app.on_event("startup")
async def startup_event():
    """Start RabbitMQ consumer in a background thread when the app starts"""
    global consumer_thread
    
    if consumer_thread is None or not consumer_thread.is_alive():
        logger.info("Starting RabbitMQ consumer thread")
        consumer_thread = threading.Thread(target=start_consuming)
        consumer_thread.daemon = True  # Thread will exit when main thread exits
        consumer_thread.start()
        logger.info("RabbitMQ consumer thread started")

@app.on_event("shutdown")
async def shutdown_event():
    """Log when the app is shutting down"""
    logger.info("Notification Service shutting down")
    # The daemon thread will terminate when the main thread exits

@app.get("/")
async def root():
    """Root endpoint returning service information"""
    return {
        "service": "Notification Service",
        "status": "running",
        "consumer_running": consumer_thread is not None and consumer_thread.is_alive(),
        "endpoints": {
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check if consumer thread is running
    consumer_status = "running" if (consumer_thread is not None and consumer_thread.is_alive()) else "stopped"
    
    return {
        "status": "healthy" if consumer_status == "running" else "unhealthy",
        "consumer": consumer_status
    }

@app.post("/test-notification")
async def test_notification(notification_type: str, data: Dict[str, Any]):
    """
    Test endpoint to simulate notification sending
    
    Args:
        notification_type (str): Type of notification to test (e.g., booking.created)
        data (Dict[str, Any]): Notification data
    """
    handler = HANDLERS.get(notification_type)
    if not handler:
        raise HTTPException(status_code=400, detail=f"Unsupported notification type: {notification_type}")

    try:
        result = handler(data)
        
        return {
            "success": result,
            "notification_type": notification_type
        }
    except Exception as e:
        logger.error(f"Error in test notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)