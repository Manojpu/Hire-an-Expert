from fastapi import FastAPI
from app.endpoints.reviews import router as reviews_router
from app.db.database import engine
from app.models import review as review_model

# Create tables if they don't exist
try:
    review_model.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error creating tables: {e}")

app = FastAPI(title = "Review Service")

app.include_router(reviews_router, prefix="/api/reviews", tags=["reviews"])

@app.get("/")
def read_root():
    return {"service": "Review Service is running"}



