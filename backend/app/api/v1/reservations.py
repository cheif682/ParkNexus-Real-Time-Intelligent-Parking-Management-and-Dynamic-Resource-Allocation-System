from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.reservation import Reservation, ReservationStatus
from app.schemas.reservation import ReservationCreate, ReservationResponse, ReservationCancel
from app.services.reservation_service import create_reservation, cancel_reservation

router = APIRouter(prefix="/reservations", tags=["Reservations"])

def enrich_reservation(res: Reservation) -> ReservationResponse:
    return ReservationResponse(
        id=res.id,
        booking_reference=res.booking_reference,
        user_id=res.user_id,
        vehicle_id=res.vehicle_id,
        facility_id=res.facility_id,
        slot_id=res.slot_id,
        start_time=res.start_time,
        end_time=res.end_time,
        estimated_amount=res.estimated_amount,
        status=res.status,
        allocation_reason=res.allocation_reason,
        created_at=res.created_at,
        updated_at=res.updated_at,
        slot_number=res.slot.slot_number if res.slot else None,
        slot_category=res.slot.category.value if res.slot else None,
        zone_name=res.slot.zone.name if res.slot and res.slot.zone else None,
        facility_name=res.facility.name if res.facility else None,
        facility_address=res.facility.address if res.facility else None,
        license_plate=res.vehicle.license_plate if res.vehicle else None,
        vehicle_make_model=res.vehicle.make_model if res.vehicle else None,
        vehicle_type=res.vehicle.vehicle_type.value if res.vehicle else None,
        user_name=res.user.full_name if res.user else None,
        user_email=res.user.email if res.user else None
    )

@router.post("/", response_model=ReservationResponse)
def make_reservation(
    data: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = create_reservation(db, current_user, data)
    return enrich_reservation(res)

@router.get("/", response_model=List[ReservationResponse])
def get_reservations(
    status: Optional[ReservationStatus] = None,
    facility_id: Optional[str] = None,
    booking_reference: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Reservation)
    
    # If customer, only show their reservations
    if current_user.role.value == "CUSTOMER":
        query = query.filter(Reservation.user_id == current_user.id)
    else:
        # Staff and admin can filter by facility
        if facility_id:
            query = query.filter(Reservation.facility_id == facility_id)

    if status:
        query = query.filter(Reservation.status == status)
    if booking_reference:
        query = query.filter(Reservation.booking_reference.ilike(f"%{booking_reference.strip()}%"))

    reservations = query.order_by(Reservation.created_at.desc()).all()
    return [enrich_reservation(r) for r in reservations]

@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(
    reservation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    if current_user.role.value == "CUSTOMER" and res.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return enrich_reservation(res)

@router.post("/{reservation_id}/cancel", response_model=ReservationResponse)
def cancel_booking(
    reservation_id: str,
    data: Optional[ReservationCancel] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reason = data.reason if data else "Customer request"
    res = cancel_reservation(db, current_user, reservation_id, reason)
    return enrich_reservation(res)
