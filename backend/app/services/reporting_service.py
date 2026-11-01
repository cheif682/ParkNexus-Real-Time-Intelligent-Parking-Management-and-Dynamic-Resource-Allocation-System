from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.facility import Facility, ParkingZone
from app.models.slot import ParkingSlot, SlotStatus
from app.models.session import ParkingSession, SessionStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.vehicle import Vehicle, VehicleType
from app.models.audit import AuditLog
from app.schemas.report import (
    AnalyticsSummaryResponse, FacilityOccupancyStat, ZoneOccupancyStat,
    DailyRevenueStat, VehicleDistributionStat, AuditLogResponse
)
from app.schemas.payment import PaymentResponse

def get_analytics_summary(db: Session) -> AnalyticsSummaryResponse:
    # 1. Facility & Slot counts
    total_facilities = db.query(Facility).filter(Facility.is_active == True).count()
    total_slots = db.query(ParkingSlot).filter(ParkingSlot.is_active == True).count()
    available_slots = db.query(ParkingSlot).filter(
        ParkingSlot.is_active == True,
        ParkingSlot.status == SlotStatus.AVAILABLE
    ).count()
    occupied_slots = db.query(ParkingSlot).filter(
        ParkingSlot.is_active == True,
        ParkingSlot.status == SlotStatus.OCCUPIED
    ).count()
    reserved_slots = db.query(ParkingSlot).filter(
        ParkingSlot.is_active == True,
        ParkingSlot.status == SlotStatus.RESERVED
    ).count()
    maintenance_slots = db.query(ParkingSlot).filter(
        ParkingSlot.is_active == True,
        ParkingSlot.status == SlotStatus.MAINTENANCE
    ).count()

    # 2. Active sessions
    active_sessions = db.query(ParkingSession).filter(
        ParkingSession.status == SessionStatus.ACTIVE
    ).count()

    # 3. Today's figures (UTC today)
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
    
    today_reservations = db.query(Reservation).filter(
        Reservation.created_at >= today_start
    ).count()

    today_rev_query = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        Payment.created_at >= today_start,
        Payment.status == PaymentStatus.SUCCESSFUL
    ).scalar()
    today_revenue = float(today_rev_query or 0.0)

    # 4. Occupancy by facility
    facility_stats = []
    facilities = db.query(Facility).filter(Facility.is_active == True).all()
    for fac in facilities:
        slots_count = len(fac.slots)
        occ = sum(1 for s in fac.slots if s.status == SlotStatus.OCCUPIED)
        res = sum(1 for s in fac.slots if s.status == SlotStatus.RESERVED)
        avail = sum(1 for s in fac.slots if s.status == SlotStatus.AVAILABLE)
        rate = round((occ + res) / slots_count * 100, 1) if slots_count > 0 else 0.0
        facility_stats.append(FacilityOccupancyStat(
            facility_id=fac.id,
            facility_name=fac.name,
            total_slots=slots_count,
            available_slots=avail,
            occupied_slots=occ,
            reserved_slots=res,
            occupancy_rate=rate
        ))

    # 5. Occupancy by zone
    zone_stats = []
    zones = db.query(ParkingZone).filter(ParkingZone.is_active == True).all()
    for z in zones:
        z_slots = len(z.slots)
        z_occ = sum(1 for s in z.slots if s.status in [SlotStatus.OCCUPIED, SlotStatus.RESERVED])
        rate = round((z_occ / z_slots * 100), 1) if z_slots > 0 else 0.0
        zone_stats.append(ZoneOccupancyStat(
            zone_id=z.id,
            zone_name=z.name,
            facility_name=z.facility.name if z.facility else "",
            total_slots=z_slots,
            occupied_slots=z_occ,
            occupancy_rate=rate
        ))

    # 6. Revenue Trends (Past 7 Days)
    revenue_trends = []
    for i in range(6, -1, -1):
        day_date = now.date() - timedelta(days=i)
        day_start = datetime(day_date.year, day_date.month, day_date.day, 0, 0, 0, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        
        rev = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
            Payment.created_at >= day_start,
            Payment.created_at < day_end,
            Payment.status == PaymentStatus.SUCCESSFUL
        ).scalar()
        
        bks = db.query(Reservation).filter(
            Reservation.created_at >= day_start,
            Reservation.created_at < day_end
        ).count()

        revenue_trends.append(DailyRevenueStat(
            date=day_date.strftime("%b %d"),
            revenue=round(float(rev or 0.0), 2),
            bookings=bks
        ))

    # 7. Vehicle Distribution
    v_total = db.query(Vehicle).count()
    v_dist = []
    for vtype in VehicleType:
        count = db.query(Vehicle).filter(Vehicle.vehicle_type == vtype).count()
        pct = round(count / v_total * 100, 1) if v_total > 0 else 0.0
        label = vtype.value.replace("_", " ").title()
        v_dist.append(VehicleDistributionStat(
            category=label,
            count=count,
            percentage=pct
        ))

    # 8. Recent transactions
    recent_payments = db.query(Payment).order_by(Payment.created_at.desc()).limit(10).all()
    recent_txns = []
    for p in recent_payments:
        recent_txns.append(PaymentResponse(
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
            booking_reference=p.reservation.booking_reference if p.reservation else None
        ))

    # 9. Recent activity
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    recent_act = []
    for l in recent_logs:
        recent_act.append(AuditLogResponse(
            id=l.id,
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            details=l.details,
            user_name=l.user.full_name if l.user else "System",
            created_at=l.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ))

    return AnalyticsSummaryResponse(
        total_facilities=total_facilities,
        total_slots=total_slots,
        available_slots=available_slots,
        occupied_slots=occupied_slots,
        reserved_slots=reserved_slots,
        maintenance_slots=maintenance_slots,
        active_sessions_count=active_sessions,
        today_reservations_count=today_reservations,
        today_revenue=round(today_revenue, 2),
        occupancy_by_facility=facility_stats,
        occupancy_by_zone=zone_stats,
        revenue_trends=revenue_trends,
        vehicle_distribution=v_dist,
        recent_transactions=recent_txns,
        recent_activity=recent_act
    )

def generate_csv_report(db: Session, report_type: str) -> str:
    """Generate CSV string for reservations, sessions or revenue"""
    lines = []
    if report_type == "reservations":
        lines.append("Booking Reference,Customer,Vehicle,Facility,Slot,Start Time,End Time,Estimated Amount,Status")
        res_list = db.query(Reservation).order_by(Reservation.created_at.desc()).all()
        for r in res_list:
            c_name = r.user.full_name if r.user else "Unknown"
            v_plate = r.vehicle.license_plate if r.vehicle else "N/A"
            f_name = r.facility.name if r.facility else "N/A"
            s_num = r.slot.slot_number if r.slot else "N/A"
            lines.append(f'"{r.booking_reference}","{c_name}","{v_plate}","{f_name}","{s_num}","{r.start_time}","{r.end_time}",{r.estimated_amount},"{r.status.value}"')
    elif report_type == "sessions":
        lines.append("Session ID,Vehicle,Facility,Slot,Entry Time,Exit Time,Duration (Mins),Final Amount,Status")
        sess_list = db.query(ParkingSession).order_by(ParkingSession.entry_time.desc()).all()
        for s in sess_list:
            v_plate = s.vehicle.license_plate if s.vehicle else "N/A"
            f_name = s.facility.name if s.facility else "N/A"
            s_num = s.slot.slot_number if s.slot else "N/A"
            lines.append(f'"{s.id}","{v_plate}","{f_name}","{s_num}","{s.entry_time}","{s.exit_time}",{s.duration_minutes or 0},{s.final_amount or 0.0},"{s.status.value}"')
    else:  # payments
        lines.append("Transaction Reference,Customer,Booking Reference,Amount,Currency,Payment Method,Status,Date")
        pays = db.query(Payment).order_by(Payment.created_at.desc()).all()
        for p in pays:
            c_name = p.user.full_name if p.user else "Unknown"
            b_ref = p.reservation.booking_reference if p.reservation else "N/A"
            lines.append(f'"{p.transaction_reference}","{c_name}","{b_ref}",{p.amount},"{p.currency}","{p.payment_method.value}","{p.status.value}","{p.created_at}"')
    
    return "\n".join(lines)
