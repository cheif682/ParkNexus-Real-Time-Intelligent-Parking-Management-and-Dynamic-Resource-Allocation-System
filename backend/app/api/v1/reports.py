from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin, require_staff_or_admin
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.report import AnalyticsSummaryResponse, AuditLogResponse
from app.services.reporting_service import get_analytics_summary, generate_csv_report

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/analytics", response_model=AnalyticsSummaryResponse)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    admin_or_staff: User = Depends(require_staff_or_admin)
):
    return get_analytics_summary(db)

@router.get("/export-csv")
def export_csv_data(
    report_type: str = Query("reservations", enum=["reservations", "sessions", "payments"]),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    csv_content = generate_csv_report(db, report_type)
    filename = f"parknexus_{report_type}_report.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        AuditLogResponse(
            id=l.id,
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            details=l.details,
            user_name=l.user.full_name if l.user else "System",
            created_at=l.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ) for l in logs
    ]
