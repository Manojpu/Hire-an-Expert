from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agora_token_builder import RtcTokenBuilder
import time, random, os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Meeting Service - Agora Integration")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

APP_ID = os.getenv("AGORA_APP_ID")
APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")

@app.get("/")
def root():
    return {
        "message": "Meeting Service - Agora Integration",
        "status": "Running",
        "port": 8007
    }

@app.get("/health")
def health_check():
    is_configured = bool(APP_ID and APP_CERTIFICATE)
    return {
        "status": "healthy" if is_configured else "not_configured",
        "service": "meeting",
        "agora_configured": is_configured
    }

@app.get("/api/agora/token")
def get_agora_token(channel_name: str):
    """Generate Agora RTC token for video conferencing."""
    if not APP_ID or not APP_CERTIFICATE:
        raise HTTPException(
            status_code=500,
            detail="Agora credentials not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env file"
        )
    
    try:
        uid = random.randint(1, 999999)
        role = 1  # 1 = publisher
        expire_time = int(time.time()) + 3600  # 1 hour
        token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID, 
            APP_CERTIFICATE, 
            channel_name, 
            uid, 
            role, 
            expire_time
        )
        return {
            "token": token, 
            "appId": APP_ID, 
            "uid": uid,
            "channelName": channel_name,
            "expireTime": expire_time
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate Agora token: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=True)
