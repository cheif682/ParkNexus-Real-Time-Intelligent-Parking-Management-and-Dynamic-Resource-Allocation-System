from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin, require_staff_or_admin
from app.models.slot import ParkingSlot, SlotCategory, SlotStatus
from app.models.facility import Facility, ParkingZone
from app.models.reservation import Reservation, ReservationStatus
from app.models.session import ParkingSession, SessionStatus
from app.models.user import User
from app.schemas.slot import ParkingSlotCreate, ParkingSlotUpdate, ParkingSlotResponse
from app.services.audit_service import log_action

router = APIRouter(prefix="/slots", tags=["Parking Slots"])

def enrich_slot(slot: ParkingSlot) -> ParkingSlotResponse:
    return ParkingSlotResponse(
        id=slot.id,
        facility_id=slot.facility_id,
        zone_id=slot.zone_id,
        slot_number=slot.slot_number,
        category=slot.category,
        status=slot.status,
        is_active=slot.is_active,
        created_at=slot.created_at,
        updated_at=slot.updated_at,
        zone_name=slot.zone.name if slot.zone else None,
        facility_name=slot.facility.name if slot.facility else None
    )

@router.get("/facility/{facility_id}", response_model=List[ParkingSlotResponse])
def get_slots_by_facility(
    facility_id: str,
    zone_id: Optional[str] = None,
    category: Optional[SlotCategory] = None,
    status: Optional[SlotStatus] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ParkingSlot).filter(ParkingSlot.facility_id == facility_id, ParkingSlot.is_active == True)
    if zone_id:
        query = query.filter(ParkingSlot.zone_id == zone_id)
    if category:
        query = query.filter(ParkingSlot.category == category)
    if status:
        query = query.filter(ParkingSlot.status == status)

    slots = query.order_by(ParkingSlot.slot_number.asc()).all()
    return [enrich_slot(s) for s in slots]

@router.post("/", response_model=ParkingSlotResponse)
def create_slot(
    data: ParkingSlotCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    slot_num = data.slot_number.strip().upper()
    existing = db.query(ParkingSlot).filter(
        ParkingSlot.facility_id == data.facility_id,
        ParkingSlot.slot_number == slot_num
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot '{slot_num}' already exists in this facility"
        )

    slot = ParkingSlot(
        facility_id=data.facility_id,
        zone_id=data.zone_id,
        slot_number=slot_num,
        category=data.category,
        status=data.status,
        is_active=data.is_active
    )
    db.add(slot)
    
    # Update facility capacity
    fac = db.query(Facility).filter(Facility.id == data.facility_id).first()
    if fac:
        fac.total_capacity += 1

    db.commit()
    db.refresh(slot)

    log_action(db, "SLOT_CREATED", "SLOT", slot.id, user_id=admin.id, details=f"Added slot {slot_num}")
    return enrich_slot(slot)

@router.put("/{slot_id}", response_model=ParkingSlotResponse)
def update_slot(
    slot_id: str,
    data: ParkingSlotUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    if data.category is not None:
        slot.category = data.category
    if data.status is not None:
        slot.status = data.status
    if data.is_active is not None:
        slot.is_active = data.is_active

    db.commit()
    db.refresh(slot)
    return enrich_slot(slot)

@router.put("/{slot_id}/maintenance", response_model=ParkingSlotResponse)
def toggle_slot_maintenance(
    slot_id: str,
    under_maintenance: bool,
    db: Session = Depends(get_db),
    staff_or_admin: User = Depends(require_staff_or_admin)
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    if under_maintenance:
        # Check active session
        active_sess = db.query(ParkingSession).filter(
            ParkingSession.slot_id == slot.id,
            ParkingSession.status == SessionStatus.ACTIVE
        ).first()
        if active_sess:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot put slot under maintenance while a parking session is active"
            )
        slot.status = SlotStatus.MAINTENANCE
    else:
        slot.status = SlotStatus.AVAILABLE

    db.commit()
    db.refresh(slot)
    log_action(
        db,
        "SLOT_MAINTENANCE_TOGGLED",
        "SLOT",
        slot.id,
        user_id=staff_or_admin.id,
        details=f"Maintenance status set to {under_maintenance} for {slot.slot_number}"
    )
    return enrich_slot(slot)

@router.delete("/{slot_id}")
def delete_slot(
    slot_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    # Guard: active sessions
    active_sess = db.query(ParkingSession).filter(
        ParkingSession.slot_id == slot.id,
        ParkingSession.status == SessionStatus.ACTIVE
    ).first()
    if active_sess:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slot has an active parking session")

    # Guard: active reservations
    active_res = db.query(Reservation).filter(
        Reservation.slot_id == slot.id,
        Reservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.ACTIVE])
    ).first()
    if active_res:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slot has active upcoming reservations")

    slot.is_active = False
    db.commit()
    log_action(db, "SLOT_DEACTIVATED", "SLOT", slot.id, user_id=admin.id)
    return {"message": "Slot deactivated successfully"}
