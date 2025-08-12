from fastapi import FastAPI

app = FastAPI(title = "Review Service")

@app.get("/")
def read_root():
    return {"Hello": "World"}


