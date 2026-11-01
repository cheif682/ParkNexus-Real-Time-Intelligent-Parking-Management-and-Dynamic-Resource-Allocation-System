from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.schemas.payment import PaymentProcessRequest, PaymentResponse
from app.services.payment_service import process_payment

router = APIRouter(prefix="/payments", tags=["Payments"])

def enrich_payment(p: Payment) -> PaymentResponse:
    b_ref = p.reservation.booking_reference if p.reservation else (p.session.reservation.booking_reference if p.session and p.session.reservation else None)
    plate = p.reservation.vehicle.license_plate if p.reservation and p.reservation.vehicle else (p.session.vehicle.license_plate if p.session and p.session.vehicle else None)
    fac_name = p.reservation.facility.name if p.reservation and p.reservation.facility else (p.session.facility.name if p.session and p.session.facility else None)
    return PaymentResponse(
        id=p.id,
        transaction_reference=p.transaction_reference,
        user_id=p.user_id,
        reservation_id=p.reservation_id,
        session_id=p.session_id,
        amount=p.amount,
        currency=p.currency,
        payment_method=p.payment_method,
        status=p.status,
        idempotency_key=p.idempotency_key,
        created_at=p.created_at,
        updated_at=p.updated_at,
        user_name=p.user.full_name if p.user else "Customer",
        user_email=p.user.email if p.user else None,
        booking_reference=b_ref,
        license_plate=plate,
        facility_name=fac_name
    )

@router.post("/process", response_model=PaymentResponse)
def make_payment(
    data: PaymentProcessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = process_payment(db, current_user, data)
    return enrich_payment(payment)

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Payment)
    if current_user.role.value == "CUSTOMER":
        query = query.filter(Payment.user_id == current_user.id)
    payments = query.order_by(Payment.created_at.desc()).all()
    return [enrich_payment(p) for p in payments]

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_receipt(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")
    if current_user.role.value == "CUSTOMER" and payment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return enrich_payment(payment)
