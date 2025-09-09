import requests
import uvicorn
from fastapi import FastAPI
from models import SignUpSchema, LoginSchema
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from fastapi.requests import Request
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",  # your frontend URL
    "http://127.0.0.1:5173",
]



load_dotenv()

# USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")
# WEBHOOK_SECRET = os.getenv("USER_SERVICE_WEBHOOK_SECRET")
USER_SERVICE_URL = "http://127.0.0.1:8001/internal/users/provision"
WEBHOOK_SECRET = "7f6b8e2e6b9147f0b34a84d5b673d3e85d3a21b6b3c847c0a9e32f8f8a172ab4"

app = FastAPI(
    description="Auth Service",
    title="Auth Service",
    docs_url='/'
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
import firebase_admin
from firebase_admin import credentials, auth


if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)



# @app.post('/signup')
# async def create_an_account(user_data:SignUpSchema):
    # email = user_data.email
    # password = user_data.password
    
    # try:
    #     user= auth.create_user(
    #         email = email,
    #         password = password
    #     )
    #     return JSONResponse(content={"message":f"User created successfully for user {user.uid}"})
    # except auth.EmailAlreadyExistsError:
    #     raise HTTPException(status_code=400, detail=f"User already exists {email}")

@app.post('/signup')
async def create_an_account(user_data:SignUpSchema):
    # email = user_data.email
    # password = user_data.password
    
    try:
        # user= auth.create_user(
        #     email = email,
        #     password = password
        # )

        # Call User Service to create DB record
        payload = {
            "firebase_uid": user_data.firebase_uid,
            "email": user_data.email,
            "full_name": user_data.email,
            "is_expert": False,           # default False if not expert
            "expert_profiles": []
        }
        headers = {
            "X-Webhook-Secret": WEBHOOK_SECRET,
            "Content-Type": "application/json"
        }

        resp = requests.post(USER_SERVICE_URL, json=payload, headers=headers)
        if resp.status_code != 200:
            return {"warning": "User created in Firebase but failed in User Service", "details": resp.text}

        return {"message": f"User created successfully for {user_data.firebase_uid}"}

    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail=f"User already exists {user_data.email}")

@app.post('/login')
async def create_access_token(user_data: LoginSchema):
    email = user_data.email
    password = user_data.password

    try:
        # Note: Firebase Admin SDK doesn't support email/password authentication directly
        # For production, you would typically use Firebase Auth REST API or client SDK
        # This is a simplified version - in production, use proper authentication flow
        
        # For now, return a message that login requires client-side implementation
        return JSONResponse(
            content={
                "message": "Login endpoint requires client-side Firebase Auth implementation",
                "instructions": "Use Firebase Auth client SDK in your frontend application"
            },
            status_code=501  # Not Implemented
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail='Authentication error'
        )

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.post('/ping')
async def validate_token(request:Request):
    headers = request.headers
    jwt = headers.get('authorization')

    user = auth.verify_id_token(jwt)

    return user["user_id"]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)