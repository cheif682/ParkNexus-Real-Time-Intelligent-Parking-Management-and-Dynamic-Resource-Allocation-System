from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_staff_or_admin
from app.models.user import User
from app.models.session import ParkingSession, SessionStatus
from app.schemas.session import SessionCheckInRequest, SessionCheckOutRequest, SessionResponse
from app.services.parking_service import verify_and_check_in, process_exit

router = APIRouter(prefix="/sessions", tags=["Parking Sessions"])

def enrich_session(s: ParkingSession) -> SessionResponse:
    return SessionResponse(
        id=s.id,
        reservation_id=s.reservation_id,
        facility_id=s.facility_id,
        slot_id=s.slot_id,
        vehicle_id=s.vehicle_id,
        user_id=s.user_id,
        entry_time=s.entry_time,
        exit_time=s.exit_time,
        duration_minutes=s.duration_minutes,
        final_amount=s.final_amount,
        status=s.status,
        created_at=s.created_at,
        updated_at=s.updated_at,
        facility_name=s.facility.name if s.facility else None,
        slot_number=s.slot.slot_number if s.slot else None,
        license_plate=s.vehicle.license_plate if s.vehicle else None,
        vehicle_make_model=s.vehicle.make_model if s.vehicle else None,
        vehicle_type=s.vehicle.vehicle_type.value if s.vehicle else None,
        user_name=s.user.full_name if s.user else "Customer",
        booking_reference=s.reservation.booking_reference if s.reservation else None
    )

@router.post("/check-in", response_model=SessionResponse)
def check_in_vehicle(
    data: SessionCheckInRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_staff_or_admin)
):
    session = verify_and_check_in(
        db=db,
        staff_user=staff_user,
        facility_id=data.facility_id,
        booking_reference=data.booking_reference,
        license_plate=data.license_plate
    )
    return enrich_session(session)

@router.post("/check-out", response_model=SessionResponse)
def check_out_vehicle(
    data: SessionCheckOutRequest,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_staff_or_admin)
):
    session, payment = process_exit(
        db=db,
        staff_user=staff_user,
        session_id=data.session_id,
        payment_method=data.payment_method or "SIMULATED",
        idempotency_key=data.idempotency_key
    )
    return enrich_session(session)

@router.get("/active", response_model=List[SessionResponse])
def get_active_sessions(
    facility_id: Optional[str] = None,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_staff_or_admin)
):
    query = db.query(ParkingSession).filter(ParkingSession.status == SessionStatus.ACTIVE)
    if facility_id:
        query = query.filter(ParkingSession.facility_id == facility_id)
    sessions = query.order_by(ParkingSession.entry_time.desc()).all()
    return [enrich_session(s) for s in sessions]

@router.get("/", response_model=List[SessionResponse])
def list_sessions(
    facility_id: Optional[str] = None,
    status: Optional[SessionStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ParkingSession)
    if current_user.role.value == "CUSTOMER":
        query = query.filter(ParkingSession.user_id == current_user.id)
    else:
        if facility_id:
            query = query.filter(ParkingSession.facility_id == facility_id)

    if status:
        query = query.filter(ParkingSession.status == status)

    sessions = query.order_by(ParkingSession.entry_time.desc()).all()
    return [enrich_session(s) for s in sessions]
