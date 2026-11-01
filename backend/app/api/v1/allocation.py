from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.facility import Facility
from app.schemas.reservation import AllocationRequest, AllocationRecommendation
from app.schemas.slot import ParkingSlotResponse
from app.services.allocation_service import find_recommended_slot
from app.services.pricing_service import calculate_fee

router = APIRouter(prefix="/allocation", tags=["Dynamic Allocation"])

@router.post("/recommend", response_model=AllocationRecommendation)
def recommend_slot(
    data: AllocationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    # 2. Fetch facility
    facility = db.query(Facility).filter(Facility.id == data.facility_id, Facility.is_active == True).first()
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")

    if data.end_time <= data.start_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End time must be after start time")

    # 3. Execute Allocation Algorithm
    best_slot, explanation, score, alternatives = find_recommended_slot(
        db=db,
        facility_id=data.facility_id,
        vehicle=vehicle,
        start_time=data.start_time,
        end_time=data.end_time,
        preferred_zone_id=data.preferred_zone_id
    )

    # 4. Calculate estimated fee
    estimated_amount, _, _, _ = calculate_fee(
        db, data.facility_id, vehicle.vehicle_type, data.start_time, data.end_time
    )

    if not best_slot:
        return AllocationRecommendation(
            is_available=False,
            recommended_slot=None,
            explanation=explanation,
            score=0.0,
            estimated_amount=estimated_amount,
            currency="INR",
            alternative_slots=[]
        )

    best_slot_resp = ParkingSlotResponse(
        id=best_slot.id,
        facility_id=best_slot.facility_id,
        zone_id=best_slot.zone_id,
        slot_number=best_slot.slot_number,
        category=best_slot.category,
        status=best_slot.status,
        is_active=best_slot.is_active,
        created_at=best_slot.created_at,
        updated_at=best_slot.updated_at,
        zone_name=best_slot.zone.name if best_slot.zone else None,
        facility_name=facility.name
    )

    alt_resps = [
        ParkingSlotResponse(
            id=s.id,
            facility_id=s.facility_id,
            zone_id=s.zone_id,
            slot_number=s.slot_number,
            category=s.category,
            status=s.status,
            is_active=s.is_active,
            created_at=s.created_at,
            updated_at=s.updated_at,
            zone_name=s.zone.name if s.zone else None,
            facility_name=facility.name
        ) for s in alternatives
    ]

    return AllocationRecommendation(
        is_available=True,
        recommended_slot=best_slot_resp,
        explanation=explanation,
        score=score,
        estimated_amount=estimated_amount,
        currency="INR",
        alternative_slots=alt_resps
    )
