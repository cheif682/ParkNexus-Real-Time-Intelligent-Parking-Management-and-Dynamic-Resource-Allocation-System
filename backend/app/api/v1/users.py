from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users Admin"])

@router.get("/", response_model=List[UserResponse])
def list_users(
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(User)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((User.full_name.ilike(s)) | (User.email.ilike(s)))
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user_details(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user_status(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone_number is not None:
        user.phone_number = data.phone_number
    if data.is_active is not None:
        user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user
