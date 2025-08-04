from fastapi import FastAPI
from app.core.config import settings

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}