from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.facility import ParkingZone, Facility
from app.models.slot import ParkingSlot, SlotStatus
from app.models.user import User
from app.schemas.facility import ParkingZoneCreate, ParkingZoneUpdate, ParkingZoneResponse

router = APIRouter(prefix="/zones", tags=["Parking Zones"])

@router.get("/facility/{facility_id}", response_model=List[ParkingZoneResponse])
def get_facility_zones(facility_id: str, db: Session = Depends(get_db)):
    zones = db.query(ParkingZone).filter(ParkingZone.facility_id == facility_id, ParkingZone.is_active == True).all()
    resp = []
    for z in zones:
        total = len(z.slots)
        avail = sum(1 for s in z.slots if s.status == SlotStatus.AVAILABLE and s.is_active)
        resp.append(ParkingZoneResponse(
            id=z.id,
            facility_id=z.facility_id,
            name=z.name,
            floor_level=z.floor_level,
            supported_types=z.supported_types,
            is_active=z.is_active,
            created_at=z.created_at,
            updated_at=z.updated_at,
            total_slots=total,
            available_slots=avail
        ))
    return resp

@router.post("/", response_model=ParkingZoneResponse)
def create_zone(
    facility_id: str,
    data: ParkingZoneCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")

    zone = ParkingZone(
        facility_id=facility_id,
        name=data.name.strip(),
        floor_level=data.floor_level.strip(),
        supported_types=data.supported_types.strip(),
        is_active=data.is_active
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return ParkingZoneResponse(
        id=zone.id,
        facility_id=zone.facility_id,
        name=zone.name,
        floor_level=zone.floor_level,
        supported_types=zone.supported_types,
        is_active=zone.is_active,
        created_at=zone.created_at,
        updated_at=zone.updated_at,
        total_slots=0,
        available_slots=0
    )

@router.put("/{zone_id}", response_model=ParkingZoneResponse)
def update_zone(
    zone_id: str,
    data: ParkingZoneUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    zone = db.query(ParkingZone).filter(ParkingZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    if data.name is not None:
        zone.name = data.name.strip()
    if data.floor_level is not None:
        zone.floor_level = data.floor_level.strip()
    if data.supported_types is not None:
        zone.supported_types = data.supported_types.strip()
    if data.is_active is not None:
        zone.is_active = data.is_active

    db.commit()
    db.refresh(zone)
    total = len(zone.slots)
    avail = sum(1 for s in zone.slots if s.status == SlotStatus.AVAILABLE and s.is_active)
    return ParkingZoneResponse(
        id=zone.id,
        facility_id=zone.facility_id,
        name=zone.name,
        floor_level=zone.floor_level,
        supported_types=zone.supported_types,
        is_active=zone.is_active,
        created_at=zone.created_at,
        updated_at=zone.updated_at,
        total_slots=total,
        available_slots=avail
    )

@router.delete("/{zone_id}")
def delete_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    zone = db.query(ParkingZone).filter(ParkingZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
    zone.is_active = False
    db.commit()
    return {"message": "Zone deactivated successfully"}
