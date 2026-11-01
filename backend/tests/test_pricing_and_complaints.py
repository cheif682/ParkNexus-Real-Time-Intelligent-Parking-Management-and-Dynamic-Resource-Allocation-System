from app.models.facility import Facility
from app.models.vehicle import VehicleType

def test_pricing_estimation(client, db):
    fac = Facility(
        name="Pricing Test Facility",
        code="PTF-01",
        address="Residency Road, Bengaluru",
        city="Bengaluru",
        total_capacity=10,
        is_active=True
    )
    db.add(fac)
    db.commit()
    db.refresh(fac)

    res = client.post("/api/v1/pricing/estimate", json={
        "facility_id": fac.id,
        "vehicle_type": "FOUR_WHEELER",
        "start_time": "2026-11-02T10:00:00Z",
        "end_time": "2026-11-02T13:30:00Z"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["hourly_rate"] == 40.0
    # 3.5 hours rounded up = 4 hours * 40 = 160.0
    assert data["estimated_amount"] == 160.0
    assert data["currency"] == "INR"

def test_complaints_flow(client, db, customer_headers, staff_headers):
    # 1. Customer creates complaint
    res = client.post("/api/v1/complaints/", json={
        "category": "SLOT_ALLOCATION",
        "title": "Sensor not detecting vehicle",
        "description": "Slot A-04 indicator still showed vacant."
    }, headers={"Authorization": customer_headers["Authorization"]})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "OPEN"
    assert data["ticket_number"].startswith("TKT-")
    complaint_id = data["id"]

    # 2. Staff updates status to IN_PROGRESS
    update_res = client.put(f"/api/v1/complaints/{complaint_id}/status", json={
        "status": "IN_PROGRESS",
        "note": "Technician dispatched to slot A-04"
    }, headers=staff_headers)
    assert update_res.status_code == 200
    up_data = update_res.json()
    assert up_data["status"] == "IN_PROGRESS"
    assert len(up_data["updates"]) >= 2
