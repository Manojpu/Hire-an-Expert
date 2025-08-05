from fastapi import FastAPI, Depends
from app.db import session, models
from app.endpoints import gig


# Create database tables
print("Creating database tables...")
models.Base.metadata.create_all(bind=session.engine)
print("Database tables created successfully!")

app = FastAPI(title="Gig Service")



app.include_router(gig.router, prefix="/gigs", tags=["gigs"], dependencies=[Depends(session.get_db)])
@app.get("/")
def read_root():
    return  {"Gig Service": "Running"}