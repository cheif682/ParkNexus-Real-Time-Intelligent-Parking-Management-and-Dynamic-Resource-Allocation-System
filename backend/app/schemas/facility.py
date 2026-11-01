from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ParkingZoneBase(BaseModel):
    name: str
    floor_level: str = "Ground"
    supported_types: str = "TWO_WHEELER,FOUR_WHEELER,ELECTRIC_VEHICLE"
    is_active: bool = True

class ParkingZoneCreate(ParkingZoneBase):
    pass

class ParkingZoneUpdate(BaseModel):
    name: Optional[str] = None
    floor_level: Optional[str] = None
    supported_types: Optional[str] = None
    is_active: Optional[bool] = None

class ParkingZoneResponse(ParkingZoneBase):
    id: str
    facility_id: str
    created_at: datetime
    updated_at: datetime
    total_slots: Optional[int] = 0
    available_slots: Optional[int] = 0

    class Config:
        from_attributes = True

class FacilityBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    code: str = Field(..., min_length=2, max_length=20)
    address: str
    city: str = "Bengaluru"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_hours: str = "24/7"
    total_capacity: int = 0
    is_active: bool = True

class FacilityCreate(FacilityBase):
    pass

class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_hours: Optional[str] = None
    total_capacity: Optional[int] = None
    is_active: Optional[bool] = None

class FacilityResponse(FacilityBase):
    id: str
    created_at: datetime
    updated_at: datetime
    zones: Optional[List[ParkingZoneResponse]] = []
    available_slots: Optional[int] = 0
    occupied_slots: Optional[int] = 0
    reserved_slots: Optional[int] = 0
    maintenance_slots: Optional[int] = 0
    occupancy_percentage: Optional[float] = 0.0

    class Config:
        from_attributes = True
