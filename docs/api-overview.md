# ParkNexus RESTful API Specification

## 1. Overview & Protocol Standards

The ParkNexus API adheres to RESTful architectural principles over HTTPS. All request and response bodies utilize JSON formatting (`application/json`).

- **Base URL Prefix**: `/api/v1`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **Redoc Documentation**: `http://localhost:8000/redoc`
- **OpenAPI JSON Schema**: `http://localhost:8000/openapi.json`

---

## 2. Authentication & Authorization

All protected endpoints require an HTTP Bearer Token in the `Authorization` request header:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

Tokens are obtained by authenticating against `POST /api/v1/auth/login`.

---

## 3. Endpoints Directory

### 3.1 Authentication & Profile (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register a new customer user account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user credentials and issue JWT token |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile and role |
| `POST` | `/api/v1/auth/change-password` | Authenticated | Update user password |

### 3.2 Facilities & Parking Assets (`/facilities`, `/zones`, `/slots`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/facilities` | Public / Auth | List parking facilities with occupancy aggregates |
| `POST` | `/api/v1/facilities` | Admin | Create a new parking facility |
| `GET` | `/api/v1/facilities/{id}` | Public / Auth | Get facility details and associated zones |
| `PUT` | `/api/v1/facilities/{id}` | Admin | Update facility configurations |
| `GET` | `/api/v1/facilities/{id}/slots` | Public / Auth | Get all physical slots for the facility |
| `GET` | `/api/v1/facilities/{id}/stats` | Staff / Admin | Get real-time occupancy counts |
| `POST` | `/api/v1/zones` | Admin | Add zone to a facility |
| `POST` | `/api/v1/slots` | Admin | Provision a new parking slot |
| `PATCH`| `/api/v1/slots/{id}/status` | Staff / Admin | Override slot status (e.g., mark MAINTENANCE) |

### 3.3 Dynamic Resource Allocation (`/allocation`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/allocation/recommend` | Authenticated | Compute optimal slot recommendation using multi-factor heuristic algorithm |

### 3.4 Dynamic Pricing & Tariff Management (`/pricing`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/pricing` | Authenticated | List all pricing plans |
| `POST` | `/api/v1/pricing/estimate` | Authenticated | Calculate projected parking fee for requested duration |
| `POST` | `/api/v1/pricing` | Admin | Create or modify dynamic tariff rules |

### 3.5 Reservations (`/reservations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/reservations` | Authenticated | Create a new slot reservation with payment |
| `GET` | `/api/v1/reservations` | Authenticated | List user's reservations (or all for Staff/Admin) |
| `GET` | `/api/v1/reservations/{id}` | Authenticated | Get detailed reservation record |
| `POST` | `/api/v1/reservations/{id}/cancel` | Authenticated | Cancel an eligible reservation and release slot |

### 3.6 Vehicle Management (`/vehicles`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/vehicles` | Authenticated | List registered vehicles for authenticated customer |
| `POST` | `/api/v1/vehicles` | Authenticated | Register a new vehicle |
| `PUT` | `/api/v1/vehicles/{id}` | Authenticated | Update vehicle information |
| `DELETE`| `/api/v1/vehicles/{id}` | Authenticated | Remove vehicle |

### 3.7 Physical Parking Sessions (`/sessions`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sessions/entry-checkin` | Staff / Admin | Record vehicle arrival, check-in, and lock slot |
| `POST` | `/api/v1/sessions/exit-checkout` | Staff / Admin | Record departure, compute final duration/charges, and release slot |
| `GET` | `/api/v1/sessions/active` | Staff / Admin | List all currently active in-facility vehicles |
| `GET` | `/api/v1/sessions/history` | Authenticated | Retrieve customer's historical parking sessions |

### 3.8 Payments & Billing Ledger (`/payments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/payments` | Authenticated | List customer or system payment transaction records |
| `POST` | `/api/v1/payments` | Authenticated | Submit payment record (simulated gateway) |

### 3.9 Customer Complaints & Disputes (`/complaints`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/complaints` | Authenticated | Submit service complaint / dispute ticket |
| `GET` | `/api/v1/complaints` | Authenticated | List customer tickets or system queue |
| `PATCH`| `/api/v1/complaints/{id}/status` | Staff / Admin | Update ticket status and staff notes |

### 3.10 Enterprise Reports & Audit Logs (`/reports`, `/audit-logs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/summary` | Admin | High-level metrics: total revenue, active sessions, utilization |
| `GET` | `/api/v1/reports/occupancy` | Staff / Admin | Occupancy breakdown by facility and zone |
| `GET` | `/api/v1/reports/revenue` | Admin | Revenue trend analysis across time ranges |
| `GET` | `/api/v1/reports/audit-logs` | Admin | Retrieve immutable system governance audit logs |
