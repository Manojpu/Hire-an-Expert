from fastapi import FastAPI
from app.endpoints.reviews import reviews
from app.db.database import engine
from app.models import review as review_model

review_model.Base.metadata.create_all(bind=engine)

app = FastAPI(title = "Review Service")

app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])

@app.get("/")
def read_root():
    return {"service": "Review Service is running"}



