from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.complaint import ComplaintCategory, ComplaintStatus

class ComplaintCreate(BaseModel):
    facility_id: Optional[str] = None
    category: ComplaintCategory
    title: str
    description: str

class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    assigned_staff_id: Optional[str] = None
    resolution_notes: Optional[str] = None
    note: Optional[str] = None

class ComplaintUpdateItem(BaseModel):
    id: str
    complaint_id: str
    user_id: str
    author_name: Optional[str] = None
    status_update: Optional[str] = None
    note: str
    created_at: str

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: str
    ticket_number: str
    user_id: str
    facility_id: Optional[str] = None
    category: ComplaintCategory
    title: str
    description: str
    status: ComplaintStatus
    assigned_staff_id: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Enrichments
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    assigned_staff_name: Optional[str] = None
    facility_name: Optional[str] = None
    updates: Optional[List[ComplaintUpdateItem]] = []

    class Config:
        from_attributes = True
