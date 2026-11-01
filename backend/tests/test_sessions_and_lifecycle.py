from datetime import datetime, timedelta, timezone
from app.models.facility import Facility, ParkingZone
from app.models.slot import ParkingSlot, SlotCategory, SlotStatus
from app.models.vehicle import Vehicle, VehicleType
from app.models.reservation import Reservation, ReservationStatus

def test_full_parking_lifecycle(client, db, staff_headers, customer_headers):
    # Setup infrastructure
    fac = Facility(
        name="Lifecycle Hub",
        code="LCH-01",
        address="Koramangala, Bengaluru",
        city="Bengaluru",
        total_capacity=5,
        is_active=True
    )
    db.add(fac)
    db.commit()
    db.refresh(fac)

    zone = ParkingZone(facility_id=fac.id, name="Zone Main", floor_level="Ground", is_active=True)
    db.add(zone)
    db.commit()
    db.refresh(zone)

    slot = ParkingSlot(
        facility_id=fac.id,
        zone_id=zone.id,
        slot_number="M-01",
        category=SlotCategory.FOUR_WHEELER,
        status=SlotStatus.AVAILABLE,
        is_active=True
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    veh = Vehicle(
        user_id=customer_headers["user_id"],
        license_plate="KA-04-LIVE-99",
        vehicle_type=VehicleType.FOUR_WHEELER,
        make_model="Swift"
    )
    db.add(veh)
    db.commit()
    db.refresh(veh)

    # Make reservation
    now = datetime.now(timezone.utc)
    res_obj = Reservation(
        booking_reference="PN-TEST-LIFECYCLE",
        user_id=customer_headers["user_id"],
        vehicle_id=veh.id,
        facility_id=fac.id,
        slot_id=slot.id,
        start_time=now - timedelta(minutes=10),
        end_time=now + timedelta(hours=2),
        estimated_amount=80.0,
        status=ReservationStatus.CONFIRMED
    )
    db.add(res_obj)
    db.commit()
    db.refresh(res_obj)

    # 1. Staff Check-in
    check_in_res = client.post("/api/v1/sessions/check-in", json={
        "facility_id": fac.id,
        "booking_reference": "PN-TEST-LIFECYCLE"
    }, headers=staff_headers)
    assert check_in_res.status_code == 200
    sess_data = check_in_res.json()
    assert sess_data["status"] == "ACTIVE"
    session_id = sess_data["id"]

    # Verify slot became OCCUPIED
    db.refresh(slot)
    assert slot.status == SlotStatus.OCCUPIED

    # 2. Duplicate check-in rejection
    dup_check_in = client.post("/api/v1/sessions/check-in", json={
        "facility_id": fac.id,
        "booking_reference": "PN-TEST-LIFECYCLE"
    }, headers=staff_headers)
    assert dup_check_in.status_code == 400

    # 3. Staff Exit processing
    checkout_res = client.post("/api/v1/sessions/check-out", json={
        "session_id": session_id,
        "payment_method": "SIMULATED",
        "idempotency_key": "IDEM-TEST-12345"
    }, headers=staff_headers)
    assert checkout_res.status_code == 200
    checkout_data = checkout_res.json()
    assert checkout_data["status"] == "COMPLETED"
    assert checkout_data["exit_time"] is not None

    # Verify slot released back to AVAILABLE!
    db.refresh(slot)
    assert slot.status == SlotStatus.AVAILABLE
