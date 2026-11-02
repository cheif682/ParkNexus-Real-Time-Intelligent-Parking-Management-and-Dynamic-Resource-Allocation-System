import uuid
import secrets
import string
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.reservation import Reservation, ReservationStatus
from app.models.vehicle import Vehicle
from app.models.facility import Facility
from app.models.slot import ParkingSlot, SlotStatus
from app.models.user import User
from app.schemas.reservation import ReservationCreate
from app.services.allocation_service import is_slot_available_for_window
from app.services.pricing_service import calculate_fee
from app.services.audit_service import log_action, create_notification

def generate_booking_reference() -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    alphabet = string.ascii_uppercase + string.digits
    random_suffix = ''.join(secrets.choice(alphabet) for _ in range(4))
    return f"PN-{date_str}-{random_suffix}"

def create_reservation(db: Session, current_user: User, data: ReservationCreate) -> Reservation:
    # 1. Validate vehicle ownership & existence
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    if vehicle.user_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only reserve for your own vehicle")

    # 2. Validate facility and slot
    facility = db.query(Facility).filter(Facility.id == data.facility_id, Facility.is_active == True).first()
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found or inactive")

    slot = db.query(ParkingSlot).filter(ParkingSlot.id == data.slot_id, ParkingSlot.facility_id == data.facility_id).first()
    if not slot or not slot.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking slot not found or inactive")
    if slot.status == SlotStatus.MAINTENANCE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slot is currently under maintenance")

    # 3. Validate times
    if data.end_time <= data.start_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End time must be after start time")

    # 4. Critical Concurrency Check: Verify slot availability atomically
    if not is_slot_available_for_window(db, slot.id, data.start_time, data.end_time):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Double-booking conflict: This slot has just been reserved for an overlapping period. Please select another slot."
        )

    # 5. Calculate estimated fee
    estimated_amount, _, _, _ = calculate_fee(
        db, facility.id, vehicle.vehicle_type, data.start_time, data.end_time
    )

    # 6. Generate unique booking reference
    booking_ref = generate_booking_reference()

    # 7. Create reservation
    reservation = Reservation(
        booking_reference=booking_ref,
        user_id=current_user.id,
        vehicle_id=vehicle.id,
        facility_id=facility.id,
        slot_id=slot.id,
        start_time=data.start_time,
        end_time=data.end_time,
        estimated_amount=estimated_amount,
        status=ReservationStatus.CONFIRMED,
        allocation_reason=f"Allocated {slot.slot_number} for {vehicle.license_plate} ({vehicle.make_model})"
    )

    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    # Audit & Notification
    log_action(
        db,
        action="RESERVATION_CREATED",
        entity_type="RESERVATION",
        entity_id=reservation.id,
        user_id=current_user.id,
        details=f"Booked {booking_ref} at {facility.name} for slot {slot.slot_number}"
    )
    create_notification(
        db,
        user_id=current_user.id,
        title="Reservation Confirmed",
        message=f"Booking {booking_ref} for {facility.name} (Slot {slot.slot_number}) has been confirmed.",
        type="RESERVATION"
    )

    return reservation

def cancel_reservation(db: Session, current_user: User, reservation_id: str, reason: str = "") -> Reservation:
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

    if reservation.user_id != current_user.id and current_user.role.value not in ["ADMIN", "PARKING_STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot cancel another user's reservation")

    if reservation.status in [ReservationStatus.ACTIVE, ReservationStatus.COMPLETED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel an active or completed parking session"
        )

    if reservation.status == ReservationStatus.CANCELLED:
        return reservation

    reservation.status = ReservationStatus.CANCELLED
    db.commit()
    db.refresh(reservation)

    log_action(
        db,
        action="RESERVATION_CANCELLED",
        entity_type="RESERVATION",
        entity_id=reservation.id,
        user_id=current_user.id,
        details=f"Reservation {reservation.booking_reference} cancelled. Reason: {reason}"
    )
    create_notification(
        db,
        user_id=reservation.user_id,
        title="Reservation Cancelled",
        message=f"Your reservation {reservation.booking_reference} has been cancelled.",
        type="RESERVATION"
    )

    return reservation
