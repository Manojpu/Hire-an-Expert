import uvicorn
import pyrebase
from fastapi import FastAPI
from models import SignUpSchema, LoginSchema
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from fastapi.requests import Request

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



@app.post('/signup')
async def create_an_account(user_data:SignUpSchema):
    email = user_data.email
    password = user_data.password
    
    try:
        user= auth.create_user(
            email = email,
            password = password
        )
        return JSONResponse(content={"message":f"User created successfully for user {user.uid}"})
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail=f"User already exists {email}")



@app.post('/login')
async def create_access_token(user_data:LoginSchema):
    email = user_data.email
    password = user_data.password

    try:
        user = firebase.auth().sign_in_with_email_and_password(
            email = email,
            password = password
        )

        token = user['idToken']
        return JSONResponse(
            content={
                "token":token
            },status_code=200
        ) 
    except:
        raise HTTPException(
            status_code=400,detail='Invalid credentials'
        )

@app.post('/ping')
async def validate_token(request:Request):
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