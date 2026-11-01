import math
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.pricing import PricingRule
from app.models.vehicle import VehicleType

DEFAULT_RATES = {
    VehicleType.TWO_WHEELER: {"hourly": 20.0, "max_daily": 150.0, "grace": 15},
    VehicleType.FOUR_WHEELER: {"hourly": 40.0, "max_daily": 300.0, "grace": 15},
    VehicleType.ELECTRIC_VEHICLE: {"hourly": 50.0, "max_daily": 350.0, "grace": 15},
    VehicleType.OTHER: {"hourly": 40.0, "max_daily": 300.0, "grace": 15},
}

def ensure_tz_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def get_pricing_rule(db: Session, facility_id: Optional[str], vehicle_type: VehicleType) -> Optional[PricingRule]:
    if facility_id:
        rule = db.query(PricingRule).filter(
            PricingRule.facility_id == facility_id,
            PricingRule.vehicle_type == vehicle_type,
            PricingRule.is_active == True
        ).first()
        if rule:
            return rule
            
    global_rule = db.query(PricingRule).filter(
        PricingRule.facility_id == None,
        PricingRule.vehicle_type == vehicle_type,
        PricingRule.is_active == True
    ).first()
    return global_rule

def calculate_fee(
    db: Session,
    facility_id: Optional[str],
    vehicle_type: VehicleType,
    start_time: datetime,
    end_time: datetime
) -> Tuple[float, float, bool, int]:
    start_time = ensure_tz_aware(start_time)
    end_time = ensure_tz_aware(end_time)

    rule = get_pricing_rule(db, facility_id, vehicle_type)
    
    if rule:
        hourly_rate = float(rule.hourly_rate)
        max_daily_rate = float(rule.max_daily_rate)
        grace_period = int(rule.grace_period_minutes)
    else:
        fallback = DEFAULT_RATES.get(vehicle_type, DEFAULT_RATES[VehicleType.FOUR_WHEELER])
        hourly_rate = fallback["hourly"]
        max_daily_rate = fallback["max_daily"]
        grace_period = fallback["grace"]

    # Calculate duration
    duration = end_time - start_time
    total_seconds = max(0, duration.total_seconds())
    duration_minutes = total_seconds / 60.0

    if duration_minutes <= grace_period:
        return 0.0, hourly_rate, False, grace_period

    hours = math.ceil(total_seconds / 3600.0)
    if hours == 0:
        hours = 1

    days = math.ceil(hours / 24.0)
    uncapped_amount = hours * hourly_rate
    capped_amount = days * max_daily_rate

    if uncapped_amount > capped_amount:
        final_amount = round(capped_amount, 2)
        applied_cap = True
    else:
        final_amount = round(uncapped_amount, 2)
        applied_cap = False

    return final_amount, hourly_rate, applied_cap, grace_period
