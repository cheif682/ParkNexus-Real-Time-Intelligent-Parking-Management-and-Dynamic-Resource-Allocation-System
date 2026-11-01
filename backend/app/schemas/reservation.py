from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.reservation import ReservationStatus
from app.models.vehicle import VehicleType
from app.schemas.slot import ParkingSlotResponse
from app.schemas.vehicle import VehicleResponse

class AllocationRequest(BaseModel):
    facility_id: str
    vehicle_id: str
    start_time: datetime
    end_time: datetime
    preferred_zone_id: Optional[str] = None

class AllocationRecommendation(BaseModel):
    is_available: bool
    recommended_slot: Optional[ParkingSlotResponse] = None
    explanation: str
    score: float
    estimated_amount: float
    currency: str = "INR"
    alternative_slots: List[ParkingSlotResponse] = []

class ReservationCreate(BaseModel):
    facility_id: str
    vehicle_id: str
    slot_id: str
    start_time: datetime
    end_time: datetime
    idempotency_key: Optional[str] = None

class ReservationCancel(BaseModel):
    reason: Optional[str] = "Customer requested cancellation"

class ReservationResponse(BaseModel):
    id: str
    booking_reference: str
    user_id: str
    vehicle_id: str
    facility_id: str
    slot_id: str
    start_time: datetime
    end_time: datetime
    estimated_amount: float
    status: ReservationStatus
    allocation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested information for rich UI display
    slot_number: Optional[str] = None
    slot_category: Optional[str] = None
    zone_name: Optional[str] = None
    facility_name: Optional[str] = None
    facility_address: Optional[str] = None
    license_plate: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    vehicle_type: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True
