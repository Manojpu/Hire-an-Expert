from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
from typing import Optional, Dict, Any

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELED = "canceled"

class PaymentBase(BaseModel):
    booking_id: str
    amount: float
    currency: str = "LKR"

class PaymentCreate(PaymentBase):
    payment_intent_id: str
    status: PaymentStatus = PaymentStatus.PENDING
    metadata: Optional[Dict[str, Any]] = None

class PaymentResponse(PaymentBase):
    id: int
    payment_intent_id: str
    status: PaymentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True