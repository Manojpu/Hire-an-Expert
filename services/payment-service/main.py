from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.endpoints import payments

app = FastAPI(title="Payment Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Payment Service", "status": "Running", "port": 8004}

app.include_router(payments.router, prefix="/payments", tags=["payments"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8004, reload=True)

