from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.session import SessionStatus

class SessionCheckInRequest(BaseModel):
    facility_id: str
    booking_reference: Optional[str] = None
    license_plate: Optional[str] = None

class SessionCheckOutRequest(BaseModel):
    session_id: str
    payment_method: Optional[str] = "SIMULATED"
    idempotency_key: Optional[str] = None

class SessionResponse(BaseModel):
    id: str
    reservation_id: Optional[str] = None
    facility_id: str
    slot_id: str
    vehicle_id: str
    user_id: Optional[str] = None
    entry_time: datetime
    exit_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    final_amount: Optional[float] = None
    status: SessionStatus
    created_at: datetime
    updated_at: datetime
    
    # UI enrichments
    facility_name: Optional[str] = None
    slot_number: Optional[str] = None
    license_plate: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    vehicle_type: Optional[str] = None
    user_name: Optional[str] = None
    booking_reference: Optional[str] = None

    class Config:
        from_attributes = True
