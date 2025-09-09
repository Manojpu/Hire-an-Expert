from pydantic import BaseModel

class SignUpSchema(BaseModel):
    email: str
    firebase_uid: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "example@gmail.com",
                "password": "samplepsw123"
            }
        }
    }



class LoginSchema(BaseModel):
    email: str
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "example@gmail.com",
                "password": "samplepsw123"
            }
        }
    }
