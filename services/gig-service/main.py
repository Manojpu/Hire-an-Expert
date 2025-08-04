from fastapi import FastAPI
from app.db import session, models


# Create database tables
print("Creating database tables...")
models.Base.metadata.create_all(bind=session.engine)
print("Database tables created successfully!")

app = FastAPI(title="Gig Service")

# Dependency to get DB session
def get_db():
    db = session.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return  {"Gig Service": "Running"}