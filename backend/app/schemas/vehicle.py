from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.vehicle import VehicleType

class VehicleBase(BaseModel):
    license_plate: str = Field(..., min_length=3, max_length=20)
    vehicle_type: VehicleType = VehicleType.FOUR_WHEELER
    make_model: str = Field(..., min_length=2, max_length=100)
    color: Optional[str] = None
    is_default: Optional[bool] = False

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    license_plate: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    make_model: Optional[str] = None
    color: Optional[str] = None
    is_default: Optional[bool] = None

class VehicleResponse(VehicleBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
