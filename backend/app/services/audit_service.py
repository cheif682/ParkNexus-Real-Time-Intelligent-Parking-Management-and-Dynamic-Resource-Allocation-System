from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog, Notification
from app.models.base import utc_now

def log_action(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    user_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    audit = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details=details,
        ip_address=ip_address,
        created_at=utc_now()
    )
    db.add(audit)
    db.commit()
    return audit

def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    type: str = "INFO"
):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        is_read=False,
        created_at=utc_now()
    )
    db.add(notif)
    db.commit()
    return notif
