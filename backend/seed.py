import sys
import os
from datetime import datetime, timedelta, timezone
import uuid

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleType
from app.models.facility import Facility, ParkingZone
from app.models.slot import ParkingSlot, SlotCategory, SlotStatus
from app.models.pricing import PricingRule
from app.models.reservation import Reservation, ReservationStatus
from app.models.session import ParkingSession, SessionStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.complaint import Complaint, ComplaintUpdate, ComplaintCategory, ComplaintStatus
from app.models.audit import AuditLog, Notification

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains data. Skipping re-seed.")
            return

        print("Seeding demonstration data for ParkNexus BEA Evaluation...")

        # 1. Create Users
        admin_user = User(
            email="admin@parknexus.com",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Rajesh Iyer (System Administrator)",
            phone_number="+91 98860 11001",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)

        staff_user1 = User(
            email="staff.btp@parknexus.com",
            hashed_password=get_password_hash("Staff@123"),
            full_name="Suresh Gowda (Staff - Tech Park)",
            phone_number="+91 98860 11002",
            role=UserRole.PARKING_STAFF,
            is_active=True
        )
        staff_user2 = User(
            email="staff.cbd@parknexus.com",
            hashed_password=get_password_hash("Staff@123"),
            full_name="Manjunath K (Staff - CBD Facility)",
            phone_number="+91 98860 11003",
            role=UserRole.PARKING_STAFF,
            is_active=True
        )
        db.add_all([staff_user1, staff_user2])

        customers_data = [
            ("arun.kumar@gmail.com", "Customer@123", "Arun Kumar", "+91 98450 12345"),
            ("priya.sharma@gmail.com", "Customer@123", "Priya Sharma", "+91 98450 67890"),
            ("rahul.verma@gmail.com", "Customer@123", "Rahul Verma", "+91 98450 11223"),
            ("ananya.rao@gmail.com", "Customer@123", "Ananya Rao", "+91 98450 44556"),
            ("karthik.s@gmail.com", "Customer@123", "Karthik Subramanian", "+91 98450 77889"),
        ]

        customer_objs = []
        for email, pwd, name, phone in customers_data:
            cust = User(
                email=email,
                hashed_password=get_password_hash(pwd),
                full_name=name,
                phone_number=phone,
                role=UserRole.CUSTOMER,
                is_active=True
            )
            db.add(cust)
            customer_objs.append(cust)

        db.commit()
        db.refresh(admin_user)
        for c in customer_objs:
            db.refresh(c)
        db.refresh(staff_user1)
        db.refresh(staff_user2)
        print("Users created successfully.")

        # 2. Create Vehicles
        vehicles_data = [
            (customer_objs[0].id, "KA-01-MJ-1024", VehicleType.FOUR_WHEELER, "Honda City (Sedan)", "Crystal Black", True),
            (customer_objs[0].id, "KA-01-EQ-4096", VehicleType.ELECTRIC_VEHICLE, "Tata Nexon EV", "Teal Blue", False),
            (customer_objs[1].id, "KA-03-NB-2048", VehicleType.FOUR_WHEELER, "Hyundai Creta (SUV)", "Polar White", True),
            (customer_objs[2].id, "KA-05-EV-8192", VehicleType.ELECTRIC_VEHICLE, "MG ZS EV", "Glaze Red", True),
            (customer_objs[2].id, "KA-05-TW-1144", VehicleType.TWO_WHEELER, "Ather 450X (EV Scooter)", "Space Grey", False),
            (customer_objs[3].id, "KA-04-MK-9900", VehicleType.FOUR_WHEELER, "Maruti Brezza", "Magma Grey", True),
            (customer_objs[4].id, "KA-02-TW-7788", VehicleType.TWO_WHEELER, "Royal Enfield Classic 350", "Stealth Black", True),
            (customer_objs[4].id, "KA-02-XC-3344", VehicleType.FOUR_WHEELER, "Kia Seltos", "Gravity Grey", False),
        ]

        vehicle_objs = []
        for uid, plate, vtype, make, col, default_val in vehicles_data:
            veh = Vehicle(
                user_id=uid,
                license_plate=plate,
                vehicle_type=vtype,
                make_model=make,
                color=col,
                is_default=default_val
            )
            db.add(veh)
            vehicle_objs.append(veh)

        db.commit()
        for v in vehicle_objs:
            db.refresh(v)
        print("Vehicles created successfully.")

        # 3. Create Facilities
        facilities_spec = [
            {
                "name": "Bengaluru Tech Park Facility",
                "code": "BTP-01",
                "address": "Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103",
                "city": "Bengaluru",
                "latitude": 12.9260,
                "longitude": 77.6762,
                "operating_hours": "24/7 Operations",
                "capacity": 36,
            },
            {
                "name": "Central Business District Parking",
                "code": "CBD-02",
                "address": "MG Road, Near Metro Station, Bengaluru, Karnataka 560001",
                "city": "Bengaluru",
                "latitude": 12.9756,
                "longitude": 77.6066,
                "operating_hours": "06:00 - 23:30",
                "capacity": 32,
            },
            {
                "name": "City Centre Parking Facility",
                "code": "CCP-03",
                "address": "100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
                "city": "Bengaluru",
                "latitude": 12.9719,
                "longitude": 77.6412,
                "operating_hours": "24/7 Operations",
                "capacity": 32,
            }
        ]

        facility_objs = []
        for f_data in facilities_spec:
            fac = Facility(
                name=f_data["name"],
                code=f_data["code"],
                address=f_data["address"],
                city=f_data["city"],
                latitude=f_data["latitude"],
                longitude=f_data["longitude"],
                operating_hours=f_data["operating_hours"],
                total_capacity=f_data["capacity"],
                is_active=True
            )
            db.add(fac)
            facility_objs.append(fac)

        db.commit()
        for fac in facility_objs:
            db.refresh(fac)
        print("Facilities created.")

        # 4. Create Zones and Parking Slots (at least 30+ slots per facility)
        all_created_slots = []
        for fac in facility_objs:
            # Create 4 distinct zones per facility
            zones_spec = [
                ("Zone A - Ground Level", "Ground", "FOUR_WHEELER,ACCESSIBLE", 10),
                ("Zone B - Express Deck", "Level 1", "FOUR_WHEELER", 10),
                ("Zone C - CleanEnergy Hub", "Ground", "ELECTRIC_VEHICLE", 8),
                ("Zone D - Two-Wheeler Bay", "Basement 1", "TWO_WHEELER", 8),
            ]
            
            zone_objs = []
            for z_name, flr, types, count in zones_spec:
                zone = ParkingZone(
                    facility_id=fac.id,
                    name=z_name,
                    floor_level=flr,
                    supported_types=types,
                    is_active=True
                )
                db.add(zone)
                zone_objs.append((zone, types, count))
            db.commit()

            # Now create individual slots in each zone
            prefix_map = {
                "Zone A - Ground Level": ("A", SlotCategory.FOUR_WHEELER),
                "Zone B - Express Deck": ("B", SlotCategory.FOUR_WHEELER),
                "Zone C - CleanEnergy Hub": ("EV", SlotCategory.ELECTRIC_VEHICLE),
                "Zone D - Two-Wheeler Bay": ("TW", SlotCategory.TWO_WHEELER),
            }

            for zone, types, count in zone_objs:
                db.refresh(zone)
                pfx, cat = prefix_map[zone.name]
                for i in range(1, count + 1):
                    slot_num = f"{pfx}-{i:02d}"
                    slot_cat = cat
                    # Set accessible slot in Zone A
                    if pfx == "A" and i in [9, 10]:
                        slot_cat = SlotCategory.ACCESSIBLE

                    slot = ParkingSlot(
                        facility_id=fac.id,
                        zone_id=zone.id,
                        slot_number=slot_num,
                        category=slot_cat,
                        status=SlotStatus.AVAILABLE,
                        is_active=True
                    )
                    db.add(slot)
                    all_created_slots.append(slot)

        db.commit()
        for s in all_created_slots:
            db.refresh(s)
        print(f"Created {len(all_created_slots)} parking slots across all facilities.")

        # 5. Pricing Rules
        pricing_data = [
            # Global defaults
            (None, VehicleType.TWO_WHEELER, 20.0, 150.0, 15),
            (None, VehicleType.FOUR_WHEELER, 40.0, 300.0, 15),
            (None, VehicleType.ELECTRIC_VEHICLE, 50.0, 350.0, 15),
            (None, VehicleType.OTHER, 40.0, 300.0, 15),
            # Tech park special rates (premium EV fast charging)
            (facility_objs[0].id, VehicleType.FOUR_WHEELER, 50.0, 350.0, 20),
            (facility_objs[0].id, VehicleType.ELECTRIC_VEHICLE, 60.0, 400.0, 20),
            # CBD rates
            (facility_objs[1].id, VehicleType.FOUR_WHEELER, 60.0, 450.0, 10),
            (facility_objs[1].id, VehicleType.TWO_WHEELER, 30.0, 200.0, 10),
        ]

        for fid, vtype, hr, mx, gr in pricing_data:
            pr = PricingRule(
                facility_id=fid,
                vehicle_type=vtype,
                hourly_rate=hr,
                max_daily_rate=mx,
                grace_period_minutes=gr,
                cancellation_penalty_pct=0.0,
                is_active=True
            )
            db.add(pr)
        db.commit()
        print("Pricing rules seeded.")

        # 6. Active and Completed Parking Sessions & Reservations
        now = datetime.now(timezone.utc)

        # Pick specific slots for demonstration:
        # Tech park facility:
        btp_slots = [s for s in all_created_slots if s.facility_id == facility_objs[0].id]
        
        # A) Active Session 1: Arun Kumar's Honda City currently parked in BTP A-01
        s_btp_a01 = next(s for s in btp_slots if s.slot_number == "A-01")
        s_btp_a01.status = SlotStatus.OCCUPIED
        res1 = Reservation(
            booking_reference="PN-20261101-AR01",
            user_id=customer_objs[0].id,
            vehicle_id=vehicle_objs[0].id,
            facility_id=facility_objs[0].id,
            slot_id=s_btp_a01.id,
            start_time=now - timedelta(hours=2),
            end_time=now + timedelta(hours=3),
            estimated_amount=250.0,
            status=ReservationStatus.ACTIVE,
            allocation_reason="Optimal compatibility: Four-Wheeler ground floor access"
        )
        db.add(res1)
        db.commit()
        db.refresh(res1)

        sess1 = ParkingSession(
            reservation_id=res1.id,
            facility_id=facility_objs[0].id,
            slot_id=s_btp_a01.id,
            vehicle_id=vehicle_objs[0].id,
            user_id=customer_objs[0].id,
            checked_in_by_user_id=staff_user1.id,
            entry_time=now - timedelta(hours=1, minutes=45),
            status=SessionStatus.ACTIVE
        )
        db.add(sess1)

        # B) Active Session 2: Rahul Verma's MG ZS EV in EV-01
        s_btp_ev01 = next(s for s in btp_slots if s.slot_number == "EV-01")
        s_btp_ev01.status = SlotStatus.OCCUPIED
        res2 = Reservation(
            booking_reference="PN-20261101-RH02",
            user_id=customer_objs[2].id,
            vehicle_id=vehicle_objs[3].id,
            facility_id=facility_objs[0].id,
            slot_id=s_btp_ev01.id,
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=4),
            estimated_amount=300.0,
            status=ReservationStatus.ACTIVE,
            allocation_reason="Direct EV Charging Station match"
        )
        db.add(res2)
        db.commit()
        db.refresh(res2)

        sess2 = ParkingSession(
            reservation_id=res2.id,
            facility_id=facility_objs[0].id,
            slot_id=s_btp_ev01.id,
            vehicle_id=vehicle_objs[3].id,
            user_id=customer_objs[2].id,
            checked_in_by_user_id=staff_user1.id,
            entry_time=now - timedelta(minutes=50),
            status=SessionStatus.ACTIVE
        )
        db.add(sess2)

        # C) Upcoming Confirmed Reservation: Priya Sharma arriving in 2 hours at BTP B-02
        s_btp_b02 = next(s for s in btp_slots if s.slot_number == "B-02")
        s_btp_b02.status = SlotStatus.RESERVED
        res3 = Reservation(
            booking_reference="PN-20261101-PR03",
            user_id=customer_objs[1].id,
            vehicle_id=vehicle_objs[2].id,
            facility_id=facility_objs[0].id,
            slot_id=s_btp_b02.id,
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=6),
            estimated_amount=200.0,
            status=ReservationStatus.CONFIRMED,
            allocation_reason="Express Deck Four-Wheeler slot allocated"
        )
        db.add(res3)

        # D) Slot in maintenance: BTP A-05
        s_btp_a05 = next(s for s in btp_slots if s.slot_number == "A-05")
        s_btp_a05.status = SlotStatus.MAINTENANCE

        # E) Past Completed Session with Payment: Ananya Rao at CBD Facility
        cbd_slots = [s for s in all_created_slots if s.facility_id == facility_objs[1].id]
        s_cbd_a02 = next(s for s in cbd_slots if s.slot_number == "A-02")
        past_res = Reservation(
            booking_reference="PN-20261031-AN04",
            user_id=customer_objs[3].id,
            vehicle_id=vehicle_objs[5].id,
            facility_id=facility_objs[1].id,
            slot_id=s_cbd_a02.id,
            start_time=now - timedelta(days=1, hours=4),
            end_time=now - timedelta(days=1, hours=1),
            estimated_amount=180.0,
            status=ReservationStatus.COMPLETED,
            allocation_reason="Ground floor slot CBD match"
        )
        db.add(past_res)
        db.commit()
        db.refresh(past_res)

        past_sess = ParkingSession(
            reservation_id=past_res.id,
            facility_id=facility_objs[1].id,
            slot_id=s_cbd_a02.id,
            vehicle_id=vehicle_objs[5].id,
            user_id=customer_objs[3].id,
            checked_in_by_user_id=staff_user2.id,
            checked_out_by_user_id=staff_user2.id,
            entry_time=now - timedelta(days=1, hours=4),
            exit_time=now - timedelta(days=1, hours=1, minutes=10),
            duration_minutes=170,
            final_amount=180.0,
            status=SessionStatus.COMPLETED
        )
        db.add(past_sess)
        db.commit()
        db.refresh(past_sess)

        # F) Payment Records
        pay1 = Payment(
            transaction_reference="TXN-20261031-898231",
            user_id=customer_objs[3].id,
            reservation_id=past_res.id,
            session_id=past_sess.id,
            amount=180.0,
            currency="INR",
            payment_method=PaymentMethod.UPI,
            status=PaymentStatus.SUCCESSFUL,
            idempotency_key="PAY-SEED-001"
        )
        db.add(pay1)

        # Additional historical payment records for past days (to populate analytics charts cleanly)
        for d in range(2, 6):
            h_date = now - timedelta(days=d, hours=3)
            h_pay = Payment(
                transaction_reference=f"TXN-202610{25+d}-4499{d}",
                user_id=customer_objs[d % len(customer_objs)].id,
                amount=float(120 + d * 45),
                currency="INR",
                payment_method=PaymentMethod.CARD if d % 2 == 0 else PaymentMethod.UPI,
                status=PaymentStatus.SUCCESSFUL,
                idempotency_key=f"PAY-HIST-{d}",
                created_at=h_date,
                updated_at=h_date
            )
            db.add(h_pay)

        # 7. Seed Complaints
        c1 = Complaint(
            ticket_number="TKT-2026-10492",
            user_id=customer_objs[0].id,
            facility_id=facility_objs[0].id,
            category=ComplaintCategory.SLOT_ALLOCATION,
            title="Fast charger EV nozzle lock query",
            description="Slot EV-01 fast charger nozzle was stiff during unhooking. Requesting maintenance inspection.",
            status=ComplaintStatus.IN_PROGRESS,
            assigned_staff_id=staff_user1.id,
            resolution_notes="Staff attended on site and lubricated connector latch."
        )
        db.add(c1)
        db.commit()
        db.refresh(c1)

        db.add(ComplaintUpdate(
            complaint_id=c1.id,
            user_id=staff_user1.id,
            status_update="IN_PROGRESS",
            note="Inspected charger connector and verified functioning.",
            created_at=(now - timedelta(hours=1)).isoformat()
        ))

        c2 = Complaint(
            ticket_number="TKT-2026-10518",
            user_id=customer_objs[1].id,
            facility_id=facility_objs[1].id,
            category=ComplaintCategory.PAYMENT,
            title="Receipt GST breakdown clarification",
            description="Wanted to obtain a company reimbursement receipt with facility GSTIN number.",
            status=ComplaintStatus.RESOLVED,
            assigned_staff_id=staff_user2.id,
            resolution_notes="Tax invoice copy emailed to customer."
        )
        db.add(c2)

        # 8. Seed Audit Logs
        db.add(AuditLog(
            user_id=admin_user.id,
            action="SYSTEM_INITIALIZED",
            entity_type="SYSTEM",
            entity_id="PARKNEXUS-CORE",
            details="Database schema initialized and seed records created.",
            created_at=now - timedelta(days=7)
        ))
        db.add(AuditLog(
            user_id=staff_user1.id,
            action="SLOT_MAINTENANCE_TOGGLED",
            entity_type="SLOT",
            entity_id=s_btp_a05.id,
            details="Marked BTP A-05 under maintenance for sensor re-calibration.",
            created_at=now - timedelta(hours=5)
        ))

        # 9. Seed Notifications
        db.add(Notification(
            user_id=customer_objs[0].id,
            title="Active Parking Session",
            message="Your vehicle KA-01-MJ-1024 is currently checked into BTP A-01.",
            type="SESSION",
            is_read=False,
            created_at=now - timedelta(hours=1)
        ))

        db.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
