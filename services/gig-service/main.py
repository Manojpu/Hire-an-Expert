from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.db import session
from app.endpoints import gig

app = FastAPI(title="Gig Service")

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://localhost:4173"],  # Common frontend dev ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "Gig Service", "status": "Running", "port": 8002}

app.include_router(gig.router, prefix="/gigs", tags=["gigs"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)