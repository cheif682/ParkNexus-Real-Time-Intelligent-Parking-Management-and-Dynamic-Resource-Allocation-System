from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.facility import Facility, ParkingZone
from app.models.slot import ParkingSlot, SlotCategory, SlotStatus
from app.models.vehicle import Vehicle, VehicleType
from app.models.reservation import Reservation, ReservationStatus
from app.models.session import ParkingSession, SessionStatus
from app.services.pricing_service import calculate_fee

CATEGORY_COMPATIBILITY: Dict[VehicleType, List[SlotCategory]] = {
    VehicleType.TWO_WHEELER: [SlotCategory.TWO_WHEELER],
    VehicleType.FOUR_WHEELER: [SlotCategory.FOUR_WHEELER, SlotCategory.ACCESSIBLE],
    VehicleType.ELECTRIC_VEHICLE: [SlotCategory.ELECTRIC_VEHICLE, SlotCategory.FOUR_WHEELER],
    VehicleType.OTHER: [SlotCategory.FOUR_WHEELER],
}

def ensure_tz_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def is_slot_available_for_window(
    db: Session,
    slot_id: str,
    start_time: datetime,
    end_time: datetime,
    exclude_reservation_id: Optional[str] = None
) -> bool:
    """
    Authoritative check: verifies if slot is free of conflicting reservations
    and active parking sessions during the specified time window.
    """
    start_time = ensure_tz_aware(start_time)
    end_time = ensure_tz_aware(end_time)

    # 1. Check slot active status
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot or not slot.is_active or slot.status == SlotStatus.MAINTENANCE:
        return False

    # 2. Check conflicting reservations
    conflicts_query = db.query(Reservation).filter(
        Reservation.slot_id == slot_id,
        Reservation.status.in_([
            ReservationStatus.CONFIRMED,
            ReservationStatus.ACTIVE,
            ReservationStatus.PENDING
        ]),
        Reservation.start_time < end_time,
        Reservation.end_time > start_time
    )
    if exclude_reservation_id:
        conflicts_query = conflicts_query.filter(Reservation.id != exclude_reservation_id)
        
    if conflicts_query.count() > 0:
        return False

    # 3. Check active session if reservation window covers now
    now = datetime.now(timezone.utc)
    if start_time <= now <= end_time:
        active_session = db.query(ParkingSession).filter(
            ParkingSession.slot_id == slot_id,
            ParkingSession.status == SessionStatus.ACTIVE
        ).first()
        if active_session:
            return False

    return True

def find_recommended_slot(
    db: Session,
    facility_id: str,
    vehicle: Vehicle,
    start_time: datetime,
    end_time: datetime,
    preferred_zone_id: Optional[str] = None
) -> Tuple[Optional[ParkingSlot], str, float, List[ParkingSlot]]:
    """
    Rule-based Dynamic Slot Allocation:
    Ranks compatible, available parking slots using multi-factor scoring.
    """
    start_time = ensure_tz_aware(start_time)
    end_time = ensure_tz_aware(end_time)

    compatible_categories = CATEGORY_COMPATIBILITY.get(vehicle.vehicle_type, [SlotCategory.FOUR_WHEELER])
    
    # Query all candidate slots in facility matching compatibility
    candidate_slots = db.query(ParkingSlot).join(ParkingZone).filter(
        ParkingSlot.facility_id == facility_id,
        ParkingSlot.is_active == True,
        ParkingSlot.status != SlotStatus.MAINTENANCE,
        ParkingSlot.category.in_(compatible_categories)
    ).all()

    if not candidate_slots:
        return None, "No compatible parking slots found in this facility.", 0.0, []

    # Get slots that are available for the entire window
    available_candidates: List[Tuple[ParkingSlot, float, List[str]]] = []
    
    for slot in candidate_slots:
        if is_slot_available_for_window(db, slot.id, start_time, end_time):
            score = 0.0
            reasons = []

            # Factor 1: Category Match
            if vehicle.vehicle_type == VehicleType.ELECTRIC_VEHICLE and slot.category == SlotCategory.ELECTRIC_VEHICLE:
                score += 50.0
                reasons.append("Dedicated EV Charging Station")
            elif slot.category.value == vehicle.vehicle_type.value:
                score += 40.0
                reasons.append(f"Direct {vehicle.vehicle_type.value.replace('_', ' ').title()} match")
            else:
                score += 25.0
                reasons.append(f"Compatible {slot.category.value.replace('_', ' ').title()} category")

            # Factor 2: Preferred Zone Match
            if preferred_zone_id and slot.zone_id == preferred_zone_id:
                score += 30.0
                reasons.append(f"Located in your preferred zone ({slot.zone.name})")

            # Factor 3: Floor Level Convenience (Ground / Level 1 preference)
            floor = (slot.zone.floor_level or "").lower()
            if any(g in floor for g in ["ground", "g", "0", "level 1", "l1"]):
                score += 15.0
                reasons.append(f"Quick entry/exit on {slot.zone.floor_level}")

            # Factor 4: Lower slot sequence index (closer to elevators/gates)
            try:
                num_part = ''.join(c for c in slot.slot_number if c.isdigit())
                if num_part:
                    proximity = max(0, 10 - (int(num_part) % 15))
                    score += proximity
            except Exception:
                pass

            available_candidates.append((slot, score, reasons))

    if not available_candidates:
        return (
            None,
            "All compatible slots are currently reserved or occupied for the requested time window.",
            0.0,
            []
        )

    # Sort candidates by score descending
    available_candidates.sort(key=lambda x: x[1], reverse=True)

    best_slot, best_score, best_reasons = available_candidates[0]
    alternatives = [item[0] for item in available_candidates[1:6]]

    # Generate transparent explanation
    duration_hrs = round((end_time - start_time).total_seconds() / 3600.0, 1)
    explanation = (
        f"Slot {best_slot.slot_number} in {best_slot.zone.name} is recommended: "
        f"{', '.join(best_reasons)}. It is 100% available for your {duration_hrs} hr window."
    )

    return best_slot, explanation, round(best_score, 1), alternatives
