# ParkNexus Enterprise Quality Assurance & Testing Strategy

## 1. Testing Philosophy

The ParkNexus quality assurance framework is engineered according to the standard enterprise **Test Pyramid**, verifying functional correctness, transactional safety, role boundaries, and concurrency isolation:

1. **Unit & Domain Rule Tests**: Validate mathematical scoring in the dynamic allocation engine and dynamic hourly pricing formulas with surge/weekend multipliers.
2. **Integration API Tests**: Exercise REST API endpoints via `httpx.AsyncClient` / `TestClient`, checking JSON payload schema conformity, HTTP status codes, and database state transitions.
3. **Transactional Concurrency & Double-Booking Tests**: Simulate simultaneous reservation requests targeting the same parking slot to guarantee zero double-bookings.
4. **Role-Based Authorization Tests**: Ensure unauthorized actors (e.g., customers attempting to access staff/admin endpoints) receive immediate `403 Forbidden` responses.

---

## 2. Test Suite Inventory

The automated test suite is housed in `backend/tests/` and run via `pytest`:

### 2.1 Authentication & Security (`test_auth.py`)
- `test_register_customer`: Validates new user creation, password hashing, and default role assignment.
- `test_login_success`: Validates correct JWT bearer token generation with claims (`sub`, `role`, `exp`).
- `test_login_invalid_password`: Validates security rejection of incorrect credentials without leakage.
- `test_rbac_access_control`: Verifies that a `CUSTOMER` JWT token is rejected when attempting to invoke admin/staff-only endpoints.

### 2.2 Dynamic Resource Allocation (`test_allocation.py`)
- `test_dynamic_allocation_recommendation`: Validates that the allocation algorithm analyzes zone occupancy, proximity, and category compatibility, selecting the optimal slot with transparent rationale explanations.
- `test_dynamic_allocation_ev_preference`: Validates that EV vehicles are prioritized for slots with installed EV chargers.

### 2.3 Pricing Calculation Engine (`test_pricing.py`)
- `test_base_pricing_calculation`: Validates standard hourly duration calculation.
- `test_peak_hour_and_weekend_multipliers`: Confirms multiplier compounding during rush hours and weekends.
- `test_grace_period_enforcement`: Confirms that durations within the 15-minute grace window do not incur charges.

### 2.4 Reservations & Concurrency Protection (`test_reservations.py`)
- `test_create_reservation_success`: Verifies reservation creation, payment recording, and slot state transitions.
- `test_double_booking_prevention`: **Critical concurrency test**. Attempts to book the identical slot for overlapping time windows. Verifies that the second attempt fails deterministically with `409 Conflict`.
- `test_cancel_reservation`: Verifies reservation cancellation releases the slot back to `AVAILABLE`.

### 2.5 Physical Session Management (`test_sessions.py`)
- `test_vehicle_entry_checkin`: Verifies gate check-in, session creation (`SESS-XXXX`), and slot state change to `OCCUPIED`.
- `test_vehicle_exit_checkout`: Verifies duration billing calculation, settlement, session completion, and slot release to `AVAILABLE`.

---

## 3. Running Automated Tests

To execute the test suite in the local development environment:

```bash
# Navigate to backend directory
cd backend

# Execute pytest with verbose output
pytest -v
```

### Test Isolation Strategy
Tests run against an in-memory SQLite database instance configured in `backend/tests/conftest.py`. An autouse fixture drops and recreates schema tables between test iterations, ensuring absolute test isolation and zero state pollution.
