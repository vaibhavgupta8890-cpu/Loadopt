# Cloud Security & Role-Based Access Control (RBAC)

## 1. Security Architecture Overview
Security in LoadOpt is implemented using a **Defense-in-Depth** model across the application, API, and persistent storage layers:

```
[Client / Browser]
       |
       | HTTPS TLS 1.3 (Encrypted in transit)
       v
[CORS Origin Filter] -> Blocks unlisted domains
       |
[OAuth2 / JWT Bearer] -> Cryptographically signed token (HMAC-SHA256)
       |
[RBAC Authorization] -> Enforced at FastAPI dependency injection layer
       |
[Pydantic v2 Engine] -> Input type validation & boundary checks
       |
[SQLAlchemy ORM]     -> Parameterized queries (Prevent SQL injection)
       |
[Database Layer]     -> Azure SQL Firewall / Private Endpoint
```

---

## 2. Authentication & Credential Storage
- **Password Hashing**: Plaintext passwords are never stored. Passwords are salted and hashed using **BCrypt** with 12 calculation rounds (`bcrypt.gensalt(12)`).
- **Session Tokens**: Stateless JSON Web Tokens (JWT) containing user ID, role claim, and expiration timestamp signed using the server-side `SECRET_KEY` via `HS256`.
- **Credential Hygiene**: Production secrets are managed through environment variables or **Azure Key Vault**, never committed to version control.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Endpoint | Admin | Logistics Manager | Viewer |
|---|---|:---:|:---:|:---:|
| **Sign In & View Profile** | `/api/auth/login`, `/me` | Yes | Yes | Yes |
| **View Dashboard & KPIs** | `/api/dashboard` | Yes | Yes | Yes |
| **View Trucks & Utilization**| `/api/trucks` | Yes | Yes | Yes |
| **Register / Edit / Delete Truck**| `POST/PUT/DELETE /api/trucks` | Yes | Yes | No (403) |
| **View Package Inventory** | `/api/packages` | Yes | Yes | Yes |
| **Create / Edit / Delete Package**| `POST/PUT/DELETE /api/packages` | Yes | Yes | No (403) |
| **Run Load Optimization** | `POST /api/optimization/run` | Yes | Yes | No (403) |
| **Run What-If Simulation** | `POST /api/simulation/run` | Yes | Yes | Yes (Preview) |
| **Apply Simulated Plan** | `POST /api/simulation/apply` | Yes | Yes | No (403) |
| **Download CSV Reports** | `/api/reports/export/*` | Yes | Yes | Yes |
| **Manage Users & Permissions**| `/api/users`, `PUT status` | Yes | No (403) | No (403) |
| **Inspect System Audit Logs** | `/api/users/audit-logs` | Yes | No (403) | No (403) |

> [!IMPORTANT]
> Permissions are enforced strictly on backend route dependencies using `require_roles([...])`. Disabling or hiding buttons in the React UI is a convenience UX enhancement; backend authorization cannot be bypassed by direct API calls.

---

## 4. Pre-Configured Demo Accounts (Local / Testing Mode)

| Role | Email | Password | Intended Test Purpose |
|---|---|---|---|
| **Admin** | `admin@loadopt.io` | `Admin@123` | Full administrative control, user toggle, audit trail |
| **Logistics Manager** | `manager@loadopt.io` | `Manager@123` | Fleet management, optimization, simulation execution |
| **Viewer** | `viewer@loadopt.io` | `Viewer@123` | Read-only observation; verified 403 HTTP rejection on write |

---

## 5. Security Controls Checklist

- [x] **Parameterized Queries**: All database interaction utilizes SQLAlchemy ORM expressions; raw dynamic string SQL concatenation is prohibited.
- [x] **CORS Origin Whitelisting**: Restricted in production to registered frontend host origins.
- [x] **Active Assignment Deletion Protection**: Trucks with active cargo assignments reject deletion with HTTP 400.
- [x] **Audit Trail**: High-consequence administrative actions (plan applications, user status changes, vehicle modifications) log operator identity and timestamp to `audit_logs`.
- [x] **Input Validation**: Pydantic models reject negative capacities, invalid dimensional values, or empty destinations before touching the business logic.
