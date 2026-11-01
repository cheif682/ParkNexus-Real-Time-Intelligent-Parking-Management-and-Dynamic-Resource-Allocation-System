from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("/", response_model=List[VehicleResponse])
def get_user_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Vehicle).filter(Vehicle.user_id == current_user.id).order_by(Vehicle.is_default.desc(), Vehicle.created_at.desc()).all()

@router.post("/", response_model=VehicleResponse)
def add_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plate = data.license_plate.strip().upper()
    existing = db.query(Vehicle).filter(Vehicle.license_plate == plate).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle registration number '{plate}' is already registered."
        )

    # If first vehicle or requested default, set default
    existing_count = db.query(Vehicle).filter(Vehicle.user_id == current_user.id).count()
    is_default = data.is_default or (existing_count == 0)

    if is_default:
        db.query(Vehicle).filter(Vehicle.user_id == current_user.id).update({"is_default": False})

    vehicle = Vehicle(
        user_id=current_user.id,
        license_plate=plate,
        vehicle_type=data.vehicle_type,
        make_model=data.make_model.strip(),
        color=data.color,
        is_default=is_default
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: str,
    data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.user_id == current_user.id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    if data.license_plate:
        plate = data.license_plate.strip().upper()
        conflict = db.query(Vehicle).filter(Vehicle.license_plate == plate, Vehicle.id != vehicle.id).first()
        if conflict:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plate already registered")
        vehicle.license_plate = plate

    if data.vehicle_type is not None:
        vehicle.vehicle_type = data.vehicle_type
    if data.make_model is not None:
        vehicle.make_model = data.make_model.strip()
    if data.color is not None:
        vehicle.color = data.color
    if data.is_default is True:
        db.query(Vehicle).filter(Vehicle.user_id == current_user.id).update({"is_default": False})
        vehicle.is_default = True

    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.user_id == current_user.id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    
    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle removed successfully"}
