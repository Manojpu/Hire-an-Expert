import uvicorn
import pyrebase
from fastapi import FastAPI
from models import SignUpSchema, LoginSchema
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from fastapi.requests import Request
import httpx
import os

app = FastAPI(
    description="Auth Service",
    title="Auth Service",
    docs_url='/'
)

import firebase_admin
from firebase_admin import credentials,auth

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

firebaseConfig = {
  "apiKey": "AIzaSyCH9tT1Y-ythqjuDQvHbGK_Y6rr8hTrBR0",
  "authDomain": "fastapiauth-fc757.firebaseapp.com",
  "projectId": "fastapiauth-fc757",
  "storageBucket": "fastapiauth-fc757.firebasestorage.app",
  "messagingSenderId": "975586146649",
  "appId": "1:975586146649:web:d0a913d8cea16a759b7448",
  "measurementId": "G-HL1EM1P3L1",
  "databaseURL":""
}

firebase = pyrebase.initialize_app(firebaseConfig)

# User service configuration
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:8001")

async def create_user_in_user_service(firebase_uid: str, email: str, name: str = None):
    """Create user in user service after Firebase authentication"""
    try:
        async with httpx.AsyncClient() as client:
            user_data = {
                "firebase_uid": firebase_uid,
                "email": email,
                "name": name or email.split('@')[0],  # Use email prefix as default name
                "role": "client"
            }
            
            response = await client.post(
                f"{USER_SERVICE_URL}/api/v1/users",
                json=user_data,
                timeout=10.0
            )
            
            if response.status_code == 201:
                return response.json()
            elif response.status_code == 409:
                # User already exists, try to get existing user
                return await get_user_from_user_service(firebase_uid)
            else:
                print(f"Error creating user in user service: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        print(f"Error communicating with user service: {str(e)}")
        return None

async def get_user_from_user_service(firebase_uid: str):
    """Get user from user service by Firebase UID"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{USER_SERVICE_URL}/api/v1/users/firebase/{firebase_uid}",
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error getting user from user service: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        print(f"Error communicating with user service: {str(e)}")
        return None

@app.post('/signup')
async def create_an_account(user_data: SignUpSchema):
    email = user_data.email
    password = user_data.password
    
    try:
        # Create user in Firebase
        user = auth.create_user(
            email=email,
            password=password
        )
        
        # Create user in user service
        user_service_user = await create_user_in_user_service(
            firebase_uid=user.uid,
            email=email,
            name=user_data.name
        )
        
        if user_service_user:
            return JSONResponse(
                content={
                    "message": f"User created successfully for user {user.uid}",
                    "user": user_service_user
                }
            )
        else:
            return JSONResponse(
                content={
                    "message": f"User created in Firebase but failed to create in user service for user {user.uid}",
                    "firebase_uid": user.uid
                }
            )
            
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail=f"User already exists {email}")

@app.post('/login')
async def create_access_token(user_data: LoginSchema):
    email = user_data.email
    password = user_data.password

    try:
        # Authenticate with Firebase
        user = firebase.auth().sign_in_with_email_and_password(
            email=email,
            password=password
        )

        token = user['idToken']
        firebase_uid = user['localId']
        
        # Get user from user service
        user_service_user = await get_user_from_user_service(firebase_uid)
        
        if user_service_user:
            return JSONResponse(
                content={
                    "token": token,
                    "user": user_service_user
                },
                status_code=200
            )
        else:
            return JSONResponse(
                content={
                    "token": token,
                    "message": "User authenticated but not found in user service"
                },
                status_code=200
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail='Invalid credentials'
        )

@app.post('/ping')
async def validate_token(request: Request):
    headers = request.headers
    jwt = headers.get('authorization')

    user = auth.verify_id_token(jwt)
    return user["user_id"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

@app.get("/")
def root():
    return {"message": "Hello World"}