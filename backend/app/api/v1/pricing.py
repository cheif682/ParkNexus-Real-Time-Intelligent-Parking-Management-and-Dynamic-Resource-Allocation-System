from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.pricing import PricingRule
from app.models.user import User
from app.schemas.pricing import (
    PricingRuleCreate, PricingRuleUpdate, PricingRuleResponse,
    PriceEstimateRequest, PriceEstimateResponse
)
from app.services.pricing_service import calculate_fee
from app.services.audit_service import log_action

router = APIRouter(prefix="/pricing", tags=["Pricing Rules"])

@router.get("/", response_model=List[PricingRuleResponse])
def get_pricing_rules(
    facility_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PricingRule).filter(PricingRule.is_active == True)
    if facility_id:
        query = query.filter((PricingRule.facility_id == facility_id) | (PricingRule.facility_id == None))
    rules = query.order_by(PricingRule.facility_id.asc(), PricingRule.vehicle_type.asc()).all()
    return [
        PricingRuleResponse(
            id=r.id,
            facility_id=r.facility_id,
            vehicle_type=r.vehicle_type,
            hourly_rate=r.hourly_rate,
            max_daily_rate=r.max_daily_rate,
            grace_period_minutes=r.grace_period_minutes,
            cancellation_penalty_pct=r.cancellation_penalty_pct,
            is_active=r.is_active,
            facility_name=r.facility.name if r.facility else "Global Default",
            created_at=r.created_at,
            updated_at=r.updated_at
        ) for r in rules
    ]

@router.post("/", response_model=PricingRuleResponse)
def create_pricing_rule(
    data: PricingRuleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    rule = PricingRule(
        facility_id=data.facility_id,
        vehicle_type=data.vehicle_type,
        hourly_rate=data.hourly_rate,
        max_daily_rate=data.max_daily_rate,
        grace_period_minutes=data.grace_period_minutes,
        cancellation_penalty_pct=data.cancellation_penalty_pct,
        is_active=data.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    log_action(db, "PRICING_RULE_CREATED", "PRICING_RULE", rule.id, user_id=admin.id)
    return PricingRuleResponse(
        id=rule.id,
        facility_id=rule.facility_id,
        vehicle_type=rule.vehicle_type,
        hourly_rate=rule.hourly_rate,
        max_daily_rate=rule.max_daily_rate,
        grace_period_minutes=rule.grace_period_minutes,
        cancellation_penalty_pct=rule.cancellation_penalty_pct,
        is_active=rule.is_active,
        facility_name=rule.facility.name if rule.facility else "Global Default",
        created_at=rule.created_at,
        updated_at=rule.updated_at
    )

@router.put("/{rule_id}", response_model=PricingRuleResponse)
def update_pricing_rule(
    rule_id: str,
    data: PricingRuleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    rule = db.query(PricingRule).filter(PricingRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing rule not found")

    if data.hourly_rate is not None:
        rule.hourly_rate = data.hourly_rate
    if data.max_daily_rate is not None:
        rule.max_daily_rate = data.max_daily_rate
    if data.grace_period_minutes is not None:
        rule.grace_period_minutes = data.grace_period_minutes
    if data.cancellation_penalty_pct is not None:
        rule.cancellation_penalty_pct = data.cancellation_penalty_pct
    if data.is_active is not None:
        rule.is_active = data.is_active

    db.commit()
    db.refresh(rule)
    log_action(db, "PRICING_RULE_UPDATED", "PRICING_RULE", rule.id, user_id=admin.id)
    return PricingRuleResponse(
        id=rule.id,
        facility_id=rule.facility_id,
        vehicle_type=rule.vehicle_type,
        hourly_rate=rule.hourly_rate,
        max_daily_rate=rule.max_daily_rate,
        grace_period_minutes=rule.grace_period_minutes,
        cancellation_penalty_pct=rule.cancellation_penalty_pct,
        is_active=rule.is_active,
        facility_name=rule.facility.name if rule.facility else "Global Default",
        created_at=rule.created_at,
        updated_at=rule.updated_at
    )

@router.post("/estimate", response_model=PriceEstimateResponse)
def estimate_price(data: PriceEstimateRequest, db: Session = Depends(get_db)):
    duration_hrs = round((data.end_time - data.start_time).total_seconds() / 3600.0, 2)
    estimated_amount, hourly_rate, applied_cap, grace = calculate_fee(
        db, data.facility_id, data.vehicle_type, data.start_time, data.end_time
    )
    return PriceEstimateResponse(
        duration_hours=max(0.1, duration_hrs),
        hourly_rate=hourly_rate,
        estimated_amount=estimated_amount,
        max_daily_cap_applied=applied_cap,
        currency="INR",
        grace_period_minutes=grace
    )
