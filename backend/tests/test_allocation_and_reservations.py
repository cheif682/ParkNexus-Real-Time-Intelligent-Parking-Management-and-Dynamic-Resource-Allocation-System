from datetime import datetime, timedelta, timezone
from app.models.facility import Facility, ParkingZone
from app.models.slot import ParkingSlot, SlotCategory, SlotStatus
from app.models.vehicle import Vehicle, VehicleType

def setup_test_facility(db):
    fac = Facility(
        name="Test Metro Facility",
        code="TMF-01",
        address="Test Road, Bengaluru",
        city="Bengaluru",
        total_capacity=10,
        is_active=True
    )
    db.add(fac)
    db.commit()
    db.refresh(fac)

    zone = ParkingZone(
        facility_id=fac.id,
        name="Zone A - Ground",
        floor_level="Ground",
        is_active=True
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)

    slots = []
    for i in range(1, 6):
        cat = SlotCategory.FOUR_WHEELER
        if i == 5:
            cat = SlotCategory.ELECTRIC_VEHICLE
        s = ParkingSlot(
            facility_id=fac.id,
            zone_id=zone.id,
            slot_number=f"A-{i:02d}",
            category=cat,
            status=SlotStatus.AVAILABLE,
            is_active=True
        )
        db.add(s)
        slots.append(s)
    db.commit()
    return fac, zone, slots

def test_dynamic_allocation_recommendation(client, db, customer_headers):
    fac, zone, slots = setup_test_facility(db)
    
    # Add vehicle for user
    veh = Vehicle(
        user_id=customer_headers["user_id"],
        license_plate="KA-01-TEST-1",
        vehicle_type=VehicleType.FOUR_WHEELER,
        make_model="Test Car",
        is_default=True
    )
    db.add(veh)
    db.commit()
    db.refresh(veh)

    now = datetime.now(timezone.utc)
    start_t = now + timedelta(hours=1)
    end_t = now + timedelta(hours=3)

    auth = {"Authorization": customer_headers["Authorization"]}
    res = client.post("/api/v1/allocation/recommend", json={
        "facility_id": fac.id,
        "vehicle_id": veh.id,
        "start_time": start_t.isoformat(),
        "end_time": end_t.isoformat()
    }, headers=auth)

    assert res.status_code == 200
    data = res.json()
    assert data["is_available"] is True
    assert data["recommended_slot"] is not None
    assert "explanation" in data
    assert data["estimated_amount"] > 0

def test_reservation_and_double_booking_prevention(client, db, customer_headers):
    fac, zone, slots = setup_test_facility(db)
    target_slot = slots[0]

    veh1 = Vehicle(
        user_id=customer_headers["user_id"],
        license_plate="KA-01-TEST-2",
        vehicle_type=VehicleType.FOUR_WHEELER,
        make_model="Test Car 2"
    )
    db.add(veh1)
    db.commit()
    db.refresh(veh1)

    now = datetime.now(timezone.utc)
    start_t = now + timedelta(hours=2)
    end_t = now + timedelta(hours=5)

    auth = {"Authorization": customer_headers["Authorization"]}

    # 1. First reservation succeeds
    res1 = client.post("/api/v1/reservations/", json={
        "facility_id": fac.id,
        "vehicle_id": veh1.id,
        "slot_id": target_slot.id,
        "start_time": start_t.isoformat(),
        "end_time": end_t.isoformat()
    }, headers=auth)
    assert res1.status_code == 200
    b_data = res1.json()
    assert b_data["booking_reference"].startswith("PN-")

    # 2. Second overlapping reservation for SAME slot MUST be rejected (Double Booking Prevention!)
    overlap_start = now + timedelta(hours=3)
    overlap_end = now + timedelta(hours=4)
    res2 = client.post("/api/v1/reservations/", json={
        "facility_id": fac.id,
        "vehicle_id": veh1.id,
        "slot_id": target_slot.id,
        "start_time": overlap_start.isoformat(),
        "end_time": overlap_end.isoformat()
    }, headers=auth)

    assert res2.status_code == 409  # Conflict!
    assert "Double-booking conflict" in res2.json()["detail"]
