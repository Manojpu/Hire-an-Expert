from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command
import os
import contextlib
from typing import AsyncIterator

from app.db import session
from app.endpoints import gig
from app.endpoints import category

app = FastAPI(title="Gig Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173",
        "http://localhost:4173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
def read_root():
    return {"message": "Gig Service", "status": "Running", "port": 8002}

app.include_router(gig.router, prefix="/gigs", tags=["gigs"])

app.include_router(category.router, prefix="/categories", tags=["categories"])

# 🚀 Run migrations using lifespan pattern instead of deprecated on_event
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup: Run migrations before the application fully starts
    print("🔄 Applying migrations...")
    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "alembic.ini"))
    alembic_cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "alembic"))
    command.upgrade(alembic_cfg, "head")
    print("✅ Database is up to date!")
    
    yield  # Application runs here
    # Shutdown: Any cleanup code would go here

# Attach the lifespan handler to the app
app.router.lifespan_context = lifespan

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)