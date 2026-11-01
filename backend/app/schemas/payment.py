from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.payment import PaymentMethod, PaymentStatus

class PaymentProcessRequest(BaseModel):
    reservation_id: Optional[str] = None
    session_id: Optional[str] = None
    amount: float
    payment_method: PaymentMethod = PaymentMethod.SIMULATED
    idempotency_key: str

class PaymentResponse(BaseModel):
    id: str
    transaction_reference: str
    user_id: str
    reservation_id: Optional[str] = None
    session_id: Optional[str] = None
    amount: float
    currency: str
    payment_method: PaymentMethod
    status: PaymentStatus
    idempotency_key: str
    created_at: datetime
    updated_at: datetime
    
    # Receipt details
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    booking_reference: Optional[str] = None
    license_plate: Optional[str] = None
    facility_name: Optional[str] = None

    class Config:
        from_attributes = True
