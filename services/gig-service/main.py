from fastapi import FastAPI, Depends
from app.db import session, models
from app.endpoints import gig


# Drop and recreate database tables
print("Dropping all tables...")
models.Base.metadata.drop_all(bind=session.engine)
print("Creating database tables...")
models.Base.metadata.create_all(bind=session.engine)
print("Database tables created successfully!")

app = FastAPI(title="Gig Service")

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "Gig Service", "status": "Running", "port": 8002}

app.include_router(gig.router, prefix="/gigs", tags=["gigs"], dependencies=[Depends(session.get_db)])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)