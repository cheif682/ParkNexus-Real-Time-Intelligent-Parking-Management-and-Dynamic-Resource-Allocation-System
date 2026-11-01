import math
import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.reservation import Reservation, ReservationStatus
from app.models.session import ParkingSession, SessionStatus
from app.models.slot import ParkingSlot, SlotStatus
from app.models.vehicle import Vehicle
from app.models.facility import Facility
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.user import User
from app.services.pricing_service import calculate_fee
from app.services.audit_service import log_action, create_notification

def verify_and_check_in(
    db: Session,
    staff_user: User,
    facility_id: str,
    booking_reference: Optional[str] = None,
    license_plate: Optional[str] = None
) -> ParkingSession:
    # 1. Search reservation
    query = db.query(Reservation).filter(Reservation.facility_id == facility_id)
    
    if booking_reference:
        query = query.filter(Reservation.booking_reference == booking_reference.strip().upper())
    elif license_plate:
        vehicle = db.query(Vehicle).filter(Vehicle.license_plate == license_plate.strip().upper()).first()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not registered in the system")
        query = query.filter(
            Reservation.vehicle_id == vehicle.id,
            Reservation.status == ReservationStatus.CONFIRMED
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide booking reference or vehicle registration number")

    reservation = query.order_by(Reservation.start_time.asc()).first()
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No eligible confirmed reservation found for this vehicle/reference at this facility"
        )

    # 2. Check reservation status
    if reservation.status == ReservationStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reservation was cancelled")
    if reservation.status in [ReservationStatus.ACTIVE, ReservationStatus.COMPLETED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reservation has already been checked in or completed")

    # 3. Check if vehicle already has an active session
    active_existing = db.query(ParkingSession).filter(
        ParkingSession.vehicle_id == reservation.vehicle_id,
        ParkingSession.status == SessionStatus.ACTIVE
    ).first()
    if active_existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle already has an active parking session in progress (Session #{active_existing.id[:8]})"
        )

    # 4. Check slot
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == reservation.slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned slot not found")

    # 5. Create Session & transition statuses atomically
    now = datetime.now(timezone.utc)
    session = ParkingSession(
        reservation_id=reservation.id,
        facility_id=facility_id,
        slot_id=slot.id,
        vehicle_id=reservation.vehicle_id,
        user_id=reservation.user_id,
        checked_in_by_user_id=staff_user.id,
        entry_time=now,
        status=SessionStatus.ACTIVE
    )
    db.add(session)

    # Transition slot & reservation
    slot.status = SlotStatus.OCCUPIED
    reservation.status = ReservationStatus.ACTIVE

    db.commit()
    db.refresh(session)

    # Audit & Notification
    log_action(
        db,
        action="VEHICLE_CHECK_IN",
        entity_type="PARKING_SESSION",
        entity_id=session.id,
        user_id=staff_user.id,
        details=f"Vehicle {reservation.vehicle.license_plate} entered slot {slot.slot_number} (Ref: {reservation.booking_reference})"
    )
    create_notification(
        db,
        user_id=reservation.user_id,
        title="Vehicle Checked In",
        message=f"Your vehicle {reservation.vehicle.license_plate} has checked in to {slot.slot_number}.",
        type="SESSION"
    )

    return session

def process_exit(
    db: Session,
    staff_user: User,
    session_id: str,
    payment_method: str = "SIMULATED",
    idempotency_key: Optional[str] = None
) -> Tuple[ParkingSession, Payment]:
    # 1. Fetch active session
    session = db.query(ParkingSession).filter(ParkingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking session not found")
    if session.status == SessionStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session has already been closed and exited")

    # 2. Compute final duration & fee
    now = datetime.now(timezone.utc)
    entry = session.entry_time.replace(tzinfo=timezone.utc) if session.entry_time.tzinfo is None else session.entry_time
    total_seconds = max(60, (now - entry).total_seconds())
    duration_minutes = int(math.ceil(total_seconds / 60.0))

    vehicle = session.vehicle
    facility_id = session.facility_id
    final_amount, hourly_rate, applied_cap, grace_period = calculate_fee(
        db, facility_id, vehicle.vehicle_type, entry, now
    )

    # 3. Process payment idempotently
    if not idempotency_key:
        idempotency_key = f"PAY-EXIT-{session.id}-{int(now.timestamp())}"

    existing_payment = db.query(Payment).filter(Payment.idempotency_key == idempotency_key).first()
    if existing_payment:
        payment = existing_payment
    else:
        txn_ref = f"TXN-{now.strftime('%Y%m%d%H%M')}-{''.join(str(uuid.uuid4()).split('-')[:2]).upper()}"
        payment = Payment(
            transaction_reference=txn_ref,
            user_id=session.user_id or staff_user.id,
            reservation_id=session.reservation_id,
            session_id=session.id,
            amount=final_amount,
            currency="INR",
            payment_method=payment_method,
            status=PaymentStatus.SUCCESSFUL,
            idempotency_key=idempotency_key
        )
        db.add(payment)

    # 4. Close session & release slot
    session.exit_time = now
    session.duration_minutes = duration_minutes
    session.final_amount = final_amount
    session.status = SessionStatus.COMPLETED
    session.checked_out_by_user_id = staff_user.id

    # Release slot back to AVAILABLE
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == session.slot_id).first()
    if slot:
        slot.status = SlotStatus.AVAILABLE

    # Close reservation if linked
    if session.reservation_id:
        reservation = db.query(Reservation).filter(Reservation.id == session.reservation_id).first()
        if reservation:
            reservation.status = ReservationStatus.COMPLETED

    db.commit()
    db.refresh(session)
    db.refresh(payment)

    # Audit & Notification
    log_action(
        db,
        action="VEHICLE_CHECK_OUT",
        entity_type="PARKING_SESSION",
        entity_id=session.id,
        user_id=staff_user.id,
        details=f"Vehicle {vehicle.license_plate} exited. Duration: {duration_minutes} mins, Paid: ₹{final_amount}"
    )
    if session.user_id:
        create_notification(
            db,
            user_id=session.user_id,
            title="Parking Session Completed",
            message=f"Parking session closed for {vehicle.license_plate}. Amount paid: ₹{final_amount}.",
            type="PAYMENT"
        )

    return session, payment
