# LoadOpt System Architecture

## 1. Architectural Philosophy & Overview
LoadOpt is built on a clean, decoupled **Three-Tier Architecture** that separates presentation, business logic, and persistent storage. This architecture complies with production software engineering standards and DP-900 (Azure Data Fundamentals) tenets.

```
+-----------------------------------------------------------------------------------+
|                                 PRESENTATION TIER                                 |
|                                                                                   |
|   React.js 19 + Vite + Tailwind CSS v4 + Lucide React + Recharts + React Router   |
|   - Responsive Dashboard Layout (Collapsible Navy Sidebar, TopBar, Toast Alerts)  |
|   - Role-Aware UI Components (Admin, Logistics Manager, Operations Viewer)        |
|   - Real-time Capacity Progress Gauges & Interactive Charts                       |
+-----------------------------------------------------------------------------------+
                                          |
                                          | HTTPS / REST JSON (JWT Bearer Auth)
                                          v
+-----------------------------------------------------------------------------------+
|                                APPLICATION TIER                                   |
|                                                                                   |
|   FastAPI + Pydantic v2 + Python Cryptography & Passlib                           |
|   ├── Authentication & RBAC Layer (OAuth2, JWT, Password Hashing)                 |
|   ├── Fleet & Package Inventory Management API                                    |
|   ├── Core Optimization Engine (Multi-Capacity Heuristic Knapsack)                |
|   ├── LIFO Loading Order Sequencer (Bottom-heavy & Rear-door accessibility)       |
|   ├── Delivery Sequencer (Haversine Spherical Distance + Nearest Neighbor)        |
|   ├── Non-Destructive What-If Simulation Engine                                   |
|   ├── Reporting & CSV Stream Exporter                                             |
|   └── Audit Logging & Exception Handling Middleware                               |
+-----------------------------------------------------------------------------------+
                                          |
                                          | SQLAlchemy 2.0 ORM (ACID Transactions)
                                          v
+-----------------------------------------------------------------------------------+
|                                   DATA TIER                                       |
|                                                                                   |
|   Relational Database Management System (RDBMS)                                   |
|   ├── Local Development: SQLite with StaticPool & Foreign Key support              |
|   ├── Production / Cloud: Microsoft Azure SQL Database (ODBC Driver 18)           |
|   ├── 8 Normalized Relational Tables: Users, Trucks, Packages,                    |
|   │   OptimizationRuns, Assignments, Deliveries, Routes, AuditLogs                |
|   └── SQL View: v_truck_utilization for Active Fleet Utilization Aggregations     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Layer Responsibilities

### Tier 1: Presentation Layer (Frontend)
- **Framework**: React 19 bootstrapped with Vite.
- **Styling**: Tailwind CSS v4 with professional logistics theme (Charcoal/Navy navigation, clean white cards, blue primary actions, emerald success, amber warning, rose danger).
- **Visualization**: Recharts library for bar graphs, pie charts, and fleet payload distributions.
- **State & Context**: `AuthContext` provides global user identity, token handling, and role permissions (`isAdmin`, `isManager`, `canModify`).
- **Network Client**: Centralized `api.js` abstraction automatically injecting JWT Bearer tokens and managing error redirects.

### Tier 2: Application Layer (Backend)
- **Framework**: FastAPI (asynchronous, high performance, type-safe with Pydantic v2).
- **Security & Authorization**: BCrypt salted password hashing, JWT access token issuance, and declarative dependency injection guards (`require_roles([...])`).
- **Optimization Domain**: Isolated in `backend/app/optimization/` completely separate from API controller routing.
- **ACID Transaction Boundary**: Guarantees that active assignment archival and revised plan application execute atomically.

### Tier 3: Data Tier (RDBMS)
- **Database Engine**: SQLAlchemy 2.0 ORM.
- **Portability**: Environment variable `DATABASE_URL` enables seamless transition between local SQLite development and Microsoft Azure SQL Database without modifying business logic.
- **Integrity**: Enforces database-level check constraints (`max_weight > 0`, `max_volume > 0`), unique indices on registration codes, foreign keys, and analytical SQL views.

---

## 3. High-Level Data Flow

```
[User Action] ---> [React Frontend]
                         |
                         | (1) POST /api/optimization/run (JWT Token)
                         v
              [FastAPI Route Handler]
                         |
                         | (2) Authenticate & Verify Permissions
                         | (3) Query Available Trucks & Eligible Packages
                         v
             [Database (SQLite / Azure SQL)]
                         |
                         | (4) Records Streamed to Optimization Engine
                         v
             [OptimizationEngine]
             ├── (5) Feasibility Filter (Weight & Volume Constraints)
             ├── (6) Multi-Objective Scoring (Priority + Affinity + Fit)
             ├── (7) Loading Order Heuristic (Reverse Delivery Sequence)
             └── (8) Route Sequencing (Nearest Neighbor with Haversine)
                         |
                         | (9) Atomic Transaction: Archive Old & Insert New
                         v
             [Database (Commit / Rollback)]
                         |
                         | (10) Return JSON OptimizationRunResponse
                         v
                 [React Dashboard]
```
