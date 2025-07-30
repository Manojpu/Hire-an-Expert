import uvicorn
from fastapi import FastAPI

app = FastAPI(
    description="Auth Service",
    title="Auth Service",
    docs_url='/'
)



import firebase_admin
from firebase_admin import credentials

cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)



@app.post('/signup')
async def create_an_account():
    pass


@app.post('/login')
async def create_access_token():
    pass

@app.post('/ping')
async def validate_token():
    pass

if __name__ == "__main__":
    uvicorn.run("main:app")

@app.get("/")
def root():
    return {"message": "Hello World"}