import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum
from typing import List
from datetime import datetime

Base = declarative_base()

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELED = "canceled"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(uuid.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(uuid.UUID(as_uuid=True), nullable=False, index=True)
    payment_intent_id = Column(uuid.UUID(as_uuid=True), nullable=False, unique=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="LKR")
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    payment_metadata = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Payment(id={self.id}, booking_id={self.booking_id}, status={self.status}, amount={self.amount})>"