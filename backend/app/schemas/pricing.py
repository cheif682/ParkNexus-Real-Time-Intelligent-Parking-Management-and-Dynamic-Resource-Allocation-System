from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.vehicle import VehicleType

class PricingRuleBase(BaseModel):
    facility_id: Optional[str] = None
    vehicle_type: VehicleType = VehicleType.FOUR_WHEELER
    hourly_rate: float = Field(..., gt=0)
    max_daily_rate: float = Field(..., gt=0)
    grace_period_minutes: int = 15
    cancellation_penalty_pct: float = 0.0
    is_active: bool = True

class PricingRuleCreate(PricingRuleBase):
    pass

class PricingRuleUpdate(BaseModel):
    hourly_rate: Optional[float] = None
    max_daily_rate: Optional[float] = None
    grace_period_minutes: Optional[int] = None
    cancellation_penalty_pct: Optional[float] = None
    is_active: Optional[bool] = None

class PricingRuleResponse(PricingRuleBase):
    id: str
    facility_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PriceEstimateRequest(BaseModel):
    facility_id: str
    vehicle_type: VehicleType
    start_time: datetime
    end_time: datetime

class PriceEstimateResponse(BaseModel):
    duration_hours: float
    hourly_rate: float
    estimated_amount: float
    max_daily_cap_applied: bool
    currency: str = "INR"
    grace_period_minutes: int
