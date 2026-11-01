from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.user import UserRole

try:
    import email_validator
    email_validator.CHECK_DELIVERABILITY = False
    email_validator.TEST_ENVIRONMENT = True
except Exception:
    pass

EMAIL_PATTERN = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

class UserBase(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN, description="Valid email address")
    full_name: str
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.CUSTOMER

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None

class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserResponse(UserBase):
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN)
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
