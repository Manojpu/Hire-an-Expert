from fastapi import FastAPI
# Comment out the database related imports for now
# from app.db import session, models
# models.Base.metadata.create_all(bind=session.engine)

app = FastAPI(title="Gig Service")

@app.get("/")
def read_root():
    return  {"Gig Service": "Running"}