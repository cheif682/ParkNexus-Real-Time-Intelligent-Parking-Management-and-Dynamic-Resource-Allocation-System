from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.slot import SlotCategory, SlotStatus

class ParkingSlotBase(BaseModel):
    slot_number: str
    category: SlotCategory = SlotCategory.FOUR_WHEELER
    status: SlotStatus = SlotStatus.AVAILABLE
    is_active: bool = True

class ParkingSlotCreate(ParkingSlotBase):
    facility_id: str
    zone_id: str

class ParkingSlotUpdate(BaseModel):
    category: Optional[SlotCategory] = None
    status: Optional[SlotStatus] = None
    is_active: Optional[bool] = None

class ParkingSlotResponse(ParkingSlotBase):
    id: str
    facility_id: str
    zone_id: str
    zone_name: Optional[str] = None
    facility_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
