import secrets
import string
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.complaint import Complaint, ComplaintUpdate, ComplaintStatus, ComplaintCategory
from app.models.user import User
from app.schemas.complaint import ComplaintCreate, ComplaintStatusUpdate
from app.services.audit_service import log_action, create_notification

def generate_ticket_number() -> str:
    year = datetime.now(timezone.utc).strftime("%Y")
    rand_seq = ''.join(secrets.choice(string.digits) for _ in range(5))
    return f"TKT-{year}-{rand_seq}"

def create_complaint(db: Session, current_user: User, data: ComplaintCreate) -> Complaint:
    ticket_num = generate_ticket_number()
    complaint = Complaint(
        ticket_number=ticket_num,
        user_id=current_user.id,
        facility_id=data.facility_id,
        category=data.category,
        title=data.title,
        description=data.description,
        status=ComplaintStatus.OPEN
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # First update entry
    now_str = datetime.now(timezone.utc).isoformat()
    init_update = ComplaintUpdate(
        complaint_id=complaint.id,
        user_id=current_user.id,
        status_update="OPEN",
        note=f"Ticket created: {data.title}",
        created_at=now_str
    )
    db.add(init_update)
    db.commit()

    log_action(
        db,
        action="COMPLAINT_CREATED",
        entity_type="COMPLAINT",
        entity_id=complaint.id,
        user_id=current_user.id,
        details=f"Created support ticket {ticket_num}: {complaint.title}"
    )

    return complaint

def update_complaint_status(
    db: Session,
    staff_user: User,
    complaint_id: str,
    data: ComplaintStatusUpdate
) -> Complaint:
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = data.status
    
    if data.assigned_staff_id:
        complaint.assigned_staff_id = data.assigned_staff_id
    if data.resolution_notes:
        complaint.resolution_notes = data.resolution_notes

    now_str = datetime.now(timezone.utc).isoformat()
    update_note = data.note or f"Status changed from {old_status.value} to {data.status.value}"
    
    history_entry = ComplaintUpdate(
        complaint_id=complaint.id,
        user_id=staff_user.id,
        status_update=data.status.value,
        note=update_note,
        created_at=now_str
    )
    db.add(history_entry)
    db.commit()
    db.refresh(complaint)

    # Notify customer
    create_notification(
        db,
        user_id=complaint.user_id,
        title=f"Support Ticket Update: {complaint.ticket_number}",
        message=f"Your ticket has been updated to '{data.status.value}'. Note: {update_note}",
        type="COMPLAINT"
    )

    log_action(
        db,
        action="COMPLAINT_STATUS_UPDATED",
        entity_type="COMPLAINT",
        entity_id=complaint.id,
        user_id=staff_user.id,
        details=f"Updated {complaint.ticket_number} to {data.status.value}"
    )

    return complaint
