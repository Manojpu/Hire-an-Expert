from pydantic import BaseModel

class SignUpSchema(BaseModel):
    email: str
    password: str
    name: str = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "example@gmail.com",
                "password": "samplepsw123",
                "name": "John Doe"
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
