import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.reservation import Reservation
from app.models.session import ParkingSession
from app.models.user import User
from app.schemas.payment import PaymentProcessRequest
from app.services.audit_service import log_action, create_notification

def process_payment(db: Session, current_user: User, data: PaymentProcessRequest) -> Payment:
    # 1. Idempotency check
    existing = db.query(Payment).filter(Payment.idempotency_key == data.idempotency_key).first()
    if existing:
        return existing

    # 2. Check reservation or session
    if data.reservation_id:
        res = db.query(Reservation).filter(Reservation.id == data.reservation_id).first()
        if not res:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
        if res.user_id != current_user.id and current_user.role.value != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    if data.session_id:
        sess = db.query(ParkingSession).filter(ParkingSession.id == data.session_id).first()
        if not sess:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking session not found")

    # 3. Create simulated payment
    now = datetime.now(timezone.utc)
    txn_ref = f"TXN-{now.strftime('%Y%m%d%H%M')}-{''.join(str(uuid.uuid4()).split('-')[:2]).upper()}"
    
    payment = Payment(
        transaction_reference=txn_ref,
        user_id=current_user.id,
        reservation_id=data.reservation_id,
        session_id=data.session_id,
        amount=round(data.amount, 2),
        currency="INR",
        payment_method=data.payment_method,
        status=PaymentStatus.SUCCESSFUL,
        idempotency_key=data.idempotency_key
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    log_action(
        db,
        action="PAYMENT_PROCESSED",
        entity_type="PAYMENT",
        entity_id=payment.id,
        user_id=current_user.id,
        details=f"Payment {txn_ref} of ₹{payment.amount} processed via {payment.payment_method}"
    )

    return payment
