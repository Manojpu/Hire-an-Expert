from fastapi import FastAPI
from app.core.config import settings

app = FastAPI()

@app.get("/")
def read_root():
    return {"database_url_is_set": settings.DATABASE_URL is not None}