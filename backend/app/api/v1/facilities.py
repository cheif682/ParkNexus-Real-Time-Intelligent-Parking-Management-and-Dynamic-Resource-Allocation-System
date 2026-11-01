from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.facility import Facility, ParkingZone
from app.models.slot import ParkingSlot, SlotStatus
from app.models.user import User
from app.schemas.facility import FacilityCreate, FacilityUpdate, FacilityResponse, ParkingZoneResponse
from app.services.audit_service import log_action

router = APIRouter(prefix="/facilities", tags=["Facilities"])

def enrich_facility_response(fac: Facility) -> FacilityResponse:
    total = len(fac.slots)
    avail = sum(1 for s in fac.slots if s.status == SlotStatus.AVAILABLE and s.is_active)
    occ = sum(1 for s in fac.slots if s.status == SlotStatus.OCCUPIED and s.is_active)
    res = sum(1 for s in fac.slots if s.status == SlotStatus.RESERVED and s.is_active)
    maint = sum(1 for s in fac.slots if s.status == SlotStatus.MAINTENANCE)
    occ_pct = round((occ + res) / total * 100, 1) if total > 0 else 0.0

    zones_resp = []
    for z in fac.zones:
        z_total = len(z.slots)
        z_avail = sum(1 for s in z.slots if s.status == SlotStatus.AVAILABLE and s.is_active)
        zones_resp.append(ParkingZoneResponse(
            id=z.id,
            facility_id=z.facility_id,
            name=z.name,
            floor_level=z.floor_level,
            supported_types=z.supported_types,
            is_active=z.is_active,
            created_at=z.created_at,
            updated_at=z.updated_at,
            total_slots=z_total,
            available_slots=z_avail
        ))

    return FacilityResponse(
        id=fac.id,
        name=fac.name,
        code=fac.code,
        address=fac.address,
        city=fac.city,
        latitude=fac.latitude,
        longitude=fac.longitude,
        operating_hours=fac.operating_hours,
        total_capacity=fac.total_capacity or total,
        is_active=fac.is_active,
        created_at=fac.created_at,
        updated_at=fac.updated_at,
        zones=zones_resp,
        available_slots=avail,
        occupied_slots=occ,
        reserved_slots=res,
        maintenance_slots=maint,
        occupancy_percentage=occ_pct
    )

@router.get("/", response_model=List[FacilityResponse])
def list_facilities(
    city: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Facility).filter(Facility.is_active == True)
    if city:
        query = query.filter(Facility.city.ilike(f"%{city.strip()}%"))
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((Facility.name.ilike(s)) | (Facility.code.ilike(s)) | (Facility.address.ilike(s)))
    
    facilities = query.order_by(Facility.name.asc()).all()
    return [enrich_facility_response(f) for f in facilities]

@router.get("/{facility_id}", response_model=FacilityResponse)
def get_facility(facility_id: str, db: Session = Depends(get_db)):
    fac = db.query(Facility).filter(Facility.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    return enrich_facility_response(fac)

@router.post("/", response_model=FacilityResponse)
def create_facility(
    data: FacilityCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    code = data.code.strip().upper()
    if db.query(Facility).filter(Facility.code == code).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Facility code already exists")
    
    fac = Facility(
        name=data.name.strip(),
        code=code,
        address=data.address.strip(),
        city=data.city.strip(),
        latitude=data.latitude,
        longitude=data.longitude,
        operating_hours=data.operating_hours,
        total_capacity=data.total_capacity,
        is_active=data.is_active
    )
    db.add(fac)
    db.commit()
    db.refresh(fac)

    log_action(db, "FACILITY_CREATED", "FACILITY", fac.id, user_id=admin.id, details=f"Created {fac.name} ({fac.code})")
    return enrich_facility_response(fac)

@router.put("/{facility_id}", response_model=FacilityResponse)
def update_facility(
    facility_id: str,
    data: FacilityUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    fac = db.query(Facility).filter(Facility.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")

    if data.name is not None:
        fac.name = data.name.strip()
    if data.code is not None:
        fac.code = data.code.strip().upper()
    if data.address is not None:
        fac.address = data.address.strip()
    if data.city is not None:
        fac.city = data.city.strip()
    if data.latitude is not None:
        fac.latitude = data.latitude
    if data.longitude is not None:
        fac.longitude = data.longitude
    if data.operating_hours is not None:
        fac.operating_hours = data.operating_hours
    if data.total_capacity is not None:
        fac.total_capacity = data.total_capacity
    if data.is_active is not None:
        fac.is_active = data.is_active

    db.commit()
    db.refresh(fac)
    log_action(db, "FACILITY_UPDATED", "FACILITY", fac.id, user_id=admin.id, details=f"Updated facility {fac.name}")
    return enrich_facility_response(fac)

@router.delete("/{facility_id}")
def deactivate_facility(
    facility_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    fac = db.query(Facility).filter(Facility.id == facility_id).first()
    if not fac:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    fac.is_active = False
    db.commit()
    log_action(db, "FACILITY_DEACTIVATED", "FACILITY", fac.id, user_id=admin.id)
    return {"message": "Facility deactivated successfully"}
