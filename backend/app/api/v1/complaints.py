from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user, require_staff_or_admin
from app.models.user import User
from app.models.complaint import Complaint, ComplaintStatus
from app.schemas.complaint import ComplaintCreate, ComplaintStatusUpdate, ComplaintResponse, ComplaintUpdateItem
from app.services.complaint_service import create_complaint, update_complaint_status

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def enrich_complaint(c: Complaint) -> ComplaintResponse:
    updates_list = [
        ComplaintUpdateItem(
            id=u.id,
            complaint_id=u.complaint_id,
            user_id=u.user_id,
            author_name=u.author.full_name if u.author else "Staff",
            status_update=u.status_update,
            note=u.note,
            created_at=str(u.created_at)
        ) for u in c.updates
    ]
    return ComplaintResponse(
        id=c.id,
        ticket_number=c.ticket_number,
        user_id=c.user_id,
        facility_id=c.facility_id,
        category=c.category,
        title=c.title,
        description=c.description,
        status=c.status,
        assigned_staff_id=c.assigned_staff_id,
        resolution_notes=c.resolution_notes,
        created_at=c.created_at,
        updated_at=c.updated_at,
        user_name=c.user.full_name if c.user else "Customer",
        user_email=c.user.email if c.user else None,
        assigned_staff_name=c.assigned_staff.full_name if c.assigned_staff else None,
        facility_name=c.facility.name if c.facility else None,
        updates=updates_list
    )

@router.post("/", response_model=ComplaintResponse)
def submit_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = create_complaint(db, current_user, data)
    return enrich_complaint(complaint)

@router.get("/", response_model=List[ComplaintResponse])
def get_complaints(
    status: Optional[ComplaintStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Complaint)
    if current_user.role.value == "CUSTOMER":
        query = query.filter(Complaint.user_id == current_user.id)
    if status:
        query = query.filter(Complaint.status == status)

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return [enrich_complaint(c) for c in complaints]

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    if current_user.role.value == "CUSTOMER" and complaint.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return enrich_complaint(complaint)

@router.put("/{complaint_id}/status", response_model=ComplaintResponse)
def update_status(
    complaint_id: str,
    data: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    staff_user: User = Depends(require_staff_or_admin)
):
    complaint = update_complaint_status(db, staff_user, complaint_id, data)
    return enrich_complaint(complaint)
