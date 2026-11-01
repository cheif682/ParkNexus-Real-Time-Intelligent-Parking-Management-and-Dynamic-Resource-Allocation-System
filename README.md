# ParkNexus — Real-Time Intelligent Parking Management and Dynamic Resource Allocation System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Containerization-Docker%20Compose-2496ED.svg?style=flat&logo=docker)](https://www.docker.com)
[![Pytest](https://img.shields.io/badge/Testing-Pytest%20Suite-0A9EDC.svg?style=flat&logo=pytest)](https://docs.pytest.org)

> **Academic Project Submission**: Building Enterprise Applications (BEA)  
> **Course Outcomes Demonstrated**: Enterprise Architecture, Role-Based Access Control (RBAC), Heuristic Resource Allocation, ACID Concurrency Management, Dynamic Pricing & Billing, End-to-End Automated Testing, and Containerized Cloud Deployment.

---

## 1. Executive Summary & Product Vision

**ParkNexus** is a centralized, cloud-native enterprise parking management platform engineered to automate modern municipal and commercial parking operations. Traditional parking systems suffer from static bay allocation, manual gate reconciliation, lack of dynamic tariff adjustments, and high customer search latency. 

ParkNexus solves these challenges by implementing an integrated end-to-end lifecycle:

$$\text{User / Vehicle Registration} \longrightarrow \text{Dynamic Allocation} \longrightarrow \text{Reservation} \longrightarrow \text{Simulated Payment} \longrightarrow \text{Gate Check-In} \longrightarrow \text{Active Session} \longrightarrow \text{Gate Checkout} \longrightarrow \text{Dynamic Billing \& Slot Release}$$

The platform supports multi-facility operations, granular zone architectures (basements, ground levels, multi-story decks), multi-category vehicle bays (Two-Wheeler, Standard Four-Wheeler, Dedicated EV with Chargers, Accessible), staff entry/exit boom barrier management, customer dispute ticketing, and enterprise financial analytics.

---

## 2. Default Demo Accounts

The database comes pre-seeded with realistic demonstration data for facilities in Bengaluru, Karnataka, India (Bengaluru Tech Park, Central Business District, City Centre Plaza), featuring 108 slots, active sessions, completed histories, vehicles, pricing tiers, and audit logs.

| Role | Email Address | Password | Intended Workflow / Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@parknexus.com` | `Admin@123` | System-wide governance, facility & slot CRUD, dynamic pricing configuration, user management, financial & utilization analytics, tamper-evident audit logs. |
| **Parking Staff** | `staff1@parknexus.com` | `Staff@123` | Entry gate verification (reservation QR / license plate check-in), exit gate checkout, overstay charge collection, real-time active sessions monitoring. |
| **Parking Staff** | `staff2@parknexus.com` | `Staff@123` | Secondary facility attendant account for multi-terminal gate testing. |
| **Customer** | `rahul.sharma@example.com` | `Customer@123` | Multi-step dynamic reservation wizard, interactive spatial slot map, vehicle management, digital booking passes, complaint filing. |
| **Customer** | `priya.patel@example.com` | `Customer@123` | Customer with registered Electric Vehicle (`KA-05-EV-1008`) demonstrating EV charger allocation prioritization. |
| **Customer** | `vikram.singh@example.com` | `Customer@123` | Customer with Two-Wheeler (`KA-03-TW-3312`) demonstrating two-wheeler bay allocation. |

---

## 3. Technology Stack & Enterprise Architecture

| Layer | Technologies & Libraries | Key Responsibilities |
| :--- | :--- | :--- |
| **Presentation Layer** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts | Responsive SaaS SPA, role-guarded routes, real-time interactive slot grids, live occupancy gauges, revenue charts. |
| **API & Ingress Gateway** | FastAPI, Uvicorn, Pydantic v2, Python-Jose (JWT), BCrypt | High-throughput asynchronous REST API, OpenAPI 3.1 documentation, RBAC dependency guards, data contract validation. |
| **Business Domain Services** | Python 3.11, Dynamic Heuristic Allocation Engine, Pricing Engine | Multi-factor spatial scoring, dynamic tariff calculation with peak/weekend multipliers, double-booking prevention. |
| **Data & Persistence Layer** | PostgreSQL 16 (production) / SQLite (zero-config local dev), SQLAlchemy 2.0 ORM, Alembic | ACID transactional guarantees, declarative ORM mapping, automated schema migrations, unique constraints. |
| **Container & Reverse Proxy** | Docker, Docker Compose, Nginx (Alpine) | Multi-stage production container builds, SPA static asset serving, reverse proxy for backend API. |

---

## 4. Key Architectural Features

### 4.1 Multi-Factor Dynamic Slot Allocation Engine
Rather than allocating arbitrary bays, ParkNexus scores candidate slots using a multi-factor heuristic:
- **Vehicle Type Compatibility**: Strict physical envelope verification (Two-Wheeler, EV, Standard, Accessible).
- **Proximity Penalty**: Distance from entry gates ($-\min(30, \text{distance}/2)$).
- **Vertical Level Weighting**: Ground level ($+10$), Level 1 ($+5$), Basements ($-5 \times |\text{floor}|$).
- **EV & Accessibility Affinity**: Dedicated $+25$ bonus for EV charging bays matching EV vehicles; $+30$ for accessible requirements.
- **Zone Occupancy Load Balancing**: Distributes vehicle load evenly across parking zones to avoid physical congestion.
- **Transparent Rationale**: Every recommendation provides an explainable human-readable rationale.

### 4.2 ACID Double-Booking Prevention
Slot reservations and walk-in check-ins enforce temporal isolation. An atomic transaction verifies:
$$\forall \text{reservation } r, \; [r.\text{start}, r.\text{end}] \cap [\text{new}.\text{start}, \text{new}.\text{end}] = \emptyset$$
Concurrent attempts to book the same slot fail deterministically with HTTP `409 Conflict`.

### 4.3 Dynamic Tariff Calculation & Grace Periods
- Standard base hourly rates.
- Peak hour multiplier ($1.25\times$) during traffic rush windows (08:00–11:00 & 17:00–20:00).
- Weekend surge multiplier ($1.15\times$) on Saturdays and Sundays.
- 15-minute free grace period for immediate turnaround.

---

## 5. Quick Start Guide

### Option A: Running with Docker Compose (Recommended)

1. Clone or navigate to the repository directory:
   ```bash
   cd c:\Users\pushp\PycharmProjects\smart_attendance
   ```

2. Launch all services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Access the applications:
   - **Frontend Web Application**: [http://localhost](http://localhost) (or port 80)
   - **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL Database**: `localhost:5432` (Credentials: `parknexus` / `parknexus_secret`)

---

### Option B: Running Locally for Development

#### Backend Setup:
```bash
# 1. Activate Python virtual environment
.\.venv\Scripts\Activate.ps1   # On Windows
# or: source .venv/bin/activate # On Linux/macOS

# 2. Install backend dependencies
cd backend
pip install -r requirements.txt

# 3. Apply database migrations
alembic upgrade head

# 4. Seed the database with demo accounts & 108 parking slots
python seed.py

# 5. Start the FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Frontend Setup:
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start Vite development server
npm run dev
# The application will launch at http://localhost:5173
```

---

## 6. Automated Testing Suite

The backend includes a comprehensive automated test suite powered by `pytest` covering authentication, RBAC authorization, dynamic slot allocation heuristics, pricing formulas, double-booking race condition prevention, and session lifecycles:

```bash
cd backend
pytest -v
```

**Test Verification Summary:**
```text
tests/test_allocation.py::test_dynamic_allocation_recommendation PASSED
tests/test_allocation.py::test_dynamic_allocation_ev_preference PASSED
tests/test_auth.py::test_register_customer PASSED
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_invalid_password PASSED
tests/test_auth.py::test_rbac_access_control PASSED
tests/test_pricing.py::test_pricing_calculation PASSED
tests/test_reservations.py::test_create_reservation_and_double_booking PASSED
tests/test_sessions.py::test_session_lifecycle PASSED

======================== 9 passed in 3.40s ========================
```

---

## 7. Project Documentation

Comprehensive enterprise architectural documentation is maintained in the [`docs/`](file:///c:/Users/pushp/PycharmProjects/smart_attendance/docs/) directory:

- [System Architecture & Enterprise Design](file:///c:/Users/pushp/PycharmProjects/smart_attendance/docs/architecture.md) — 3-Tier Layered Architecture, Component Interaction, Security & Audit Logging.
- [Database Design & Schema Dictionary](file:///c:/Users/pushp/PycharmProjects/smart_attendance/docs/database-design.md) — Entity-Relationship Diagram, Table Schemas, Constraints, and Indexes.
- [Business Workflows & Dynamic Allocation](file:///c:/Users/pushp/PycharmProjects/smart_attendance/docs/business-workflows.md) — Sequence Diagrams for Booking, Gate Check-In/Checkout, and Allocation Scoring Formulas.
- [API Overview & Endpoints Specification](file:///c:/Users/pushp/PycharmProjects/smart_attendance/docs/api-overview.md) — Complete REST API Directory, Payloads, and Security Schemas.
- [Testing & Quality Assurance Strategy](file:///c:/Users/pushp/PycharmProjects/smart_attendance/docs/testing-strategy.md) — Test Matrix, Pytest Automation, and Concurrency Verification.

---

## 8. Academic Integrity & Course Deliverables Checklist

- [x] **Relational Data Modeling**: 11 normalized tables with foreign keys, compound indexes, and Alembic migrations.
- [x] **Role-Based Access Control**: Strict segregation between `CUSTOMER`, `PARKING_STAFF`, and `ADMIN`.
- [x] **Dynamic Heuristic Allocation**: Production implementation of the multi-factor scoring algorithm.
- [x] **ACID Concurrency Controls**: Tested double-booking prevention under simultaneous requests.
- [x] **Dynamic Pricing Engine**: Automated calculations for peak-hour surcharges, weekend multipliers, and grace periods.
- [x] **Production Grade UI/UX**: Polished React + Vite + Tailwind interface following Stripe/Linear design principles.
- [x] **Containerization**: Multi-stage `Dockerfile` and `docker-compose.yml` for unified deployment.
- [x] **Automated Testing**: 100% passing test suite covering critical enterprise workflows.
