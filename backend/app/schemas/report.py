from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.schemas.payment import PaymentResponse
from app.schemas.session import SessionResponse

class FacilityOccupancyStat(BaseModel):
    facility_id: str
    facility_name: str
    total_slots: int
    available_slots: int
    occupied_slots: int
    reserved_slots: int
    occupancy_rate: float

class ZoneOccupancyStat(BaseModel):
    zone_id: str
    zone_name: str
    facility_name: str
    total_slots: int
    occupied_slots: int
    occupancy_rate: float

class DailyRevenueStat(BaseModel):
    date: str
    revenue: float
    bookings: int

class VehicleDistributionStat(BaseModel):
    category: str
    count: int
    percentage: float

class AuditLogResponse(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None
    user_name: Optional[str] = None
    created_at: str

class AnalyticsSummaryResponse(BaseModel):
    total_facilities: int
    total_slots: int
    available_slots: int
    occupied_slots: int
    reserved_slots: int
    maintenance_slots: int
    active_sessions_count: int
    today_reservations_count: int
    today_revenue: float
    occupancy_by_facility: List[FacilityOccupancyStat]
    occupancy_by_zone: List[ZoneOccupancyStat]
    revenue_trends: List[DailyRevenueStat]
    vehicle_distribution: List[VehicleDistributionStat]
    recent_transactions: List[PaymentResponse]
    recent_activity: List[AuditLogResponse]
