# LoadOpt — Smart Truck Loading and Delivery Optimization System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF.svg?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/CSS-Tailwind%20v4-38B2AC.svg?logo=tailwindcss)](https://tailwindcss.com)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy%202.0-D71F00.svg)](https://www.sqlalchemy.org)
[![Azure SQL Ready](https://img.shields.io/badge/RDBMS-Azure%20SQL%20Ready-0078D4.svg?logo=microsoftazure)](https://azure.microsoft.com)
[![Pytest](https://img.shields.io/badge/Tests-16%20Passed-brightgreen.svg?logo=pytest)](https://pytest.org)

> A production-grade logistics management and optimization web application engineered for college-level technical evaluation demonstrating **System Design, RDBMS, DP-900 (Azure Data Fundamentals), Cloud Security, Data Structures & Algorithms, and Full-Stack Web Development**.

---

## 1. Project Overview & Problem Statement

In modern commercial freight transportation, manual truck cargo loading results in critical operational liabilities:
1. **Unused Vehicle Capacity**: Inefficient allocation leaves trucks partially empty, driving up fuel and vehicle operational costs.
2. **Constraint Violations**: Exceeding gross vehicle weight limits damages axles, risks rollovers, and leads to expensive regulatory fines.
3. **Suboptimal Delivery Routing**: Random package loading forces drivers to unload earlier packages from behind deeper freight at every delivery stop.

**LoadOpt** resolves this challenge by providing a centralized logistics control application that enforces multi-dimensional knapsack constraints, prioritizes critical shipments, recommends physically sensible LIFO loading sequences, optimizes waypoint routing using the spherical Haversine formula, and allows non-destructive What-If scenario simulations.

---

## 2. Key Features

- **Multi-Constraint Optimization Engine**: Solves the Multi-Capacity Knapsack problem evaluating dual hard limits: Weight Capacity (kg) and Volumetric Storage ($m^3$).
- **LIFO Loading Order Recommendation**: Sequences package loading so items for earlier delivery stops are near the rear doors, while heavier packages are placed on the bottom.
- **Priority-Weighted Delivery Sequencer**: Computes optimal stop-by-stop delivery paths starting from the central depot using Haversine great-circle distances.
- **What-If Logistics Simulation**: Non-destructively models real-world disruptions (vehicle breakdown, urgent priority package arrival, capacity cuts) with delta comparisons before committing transactionally to the database.
- **Relational RDBMS & Azure SQL Ready**: 8 normalized tables with foreign keys, check constraints, and an analytical SQL view (`v_truck_utilization`).
- **Cloud Security & RBAC**: Salted BCrypt password hashing, signed JWT tokens, and strict Role-Based Access Control (`Admin`, `Logistics Manager`, `Viewer`).
- **Live Analytical Dashboard**: Real-time KPI aggregation and Recharts data visualizations (utilization bars, priority distribution, live audit logs).
- **Audit-Grade CSV Export**: Streamed CSV downloads for fleet utilization, package inventory, and active assignments.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React Icons, Recharts, React Router DOM |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Passlib, BCrypt, Python-JOSE |
| **Database** | SQLite (Local Dev) / Microsoft Azure SQL Database (Production Cloud) |
| **Testing** | Pytest, HTTPX, FastAPI TestClient |
| **DevOps / Cloud** | Microsoft Azure App Service, Azure Static Web Apps, Azure SQL Serverless |

---

## 4. Default Demonstration Accounts

The system provides three pre-configured accounts with distinct RBAC permission levels:

| Role | Email | Password | Tailored Essential Access Rights |
|---|---|---|---|
| **Admin** | `admin@loadopt.io` | `Admin@123` | **Full Master Control**: Complete operational visibility + User Management + System Audit Logs |
| **Logistics Manager** | `manager@loadopt.io` | `Manager@123` | **Operational Command**: Fleet management, cargo packages, load optimization engine, delivery planning, what-if simulation lab, reports & CSV export |
| **Viewer** | `viewer@loadopt.io` | `Viewer@123` | **Client / Driver Tracking Portal**: Focused exclusively on targeted delivery tracking (`/tracking`). Enter Packet # or Truck # to view real-time delivery status, sequence stop, and vehicle allocation. All internal management menus are hidden. |

---

## 5. Quick Start: Local Development

### Prerequisites
- Python 3.10+ (Python 3.14 compatible)
- Node.js 18+ and npm

### Step 1: Clone Repository
```bash
git clone https://github.com/vaibhavgupta8890-cpu/Loadopt.git
cd Loadopt
```

### Step 2: Backend Setup
```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Seed realistic demonstration dataset (6 trucks, 18 packages, 3 users)
python scripts/seed_demo_data.py --reset

# 3. Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend API will be accessible at:
- **API URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

### Step 3: Frontend Setup
In a new terminal window:
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```
Open your browser at **`http://localhost:5173`**.

---

## 6. Running Automated Tests

Run the complete test suite verifying capacity constraints, unique constraints, RBAC authorization, and transactional rollbacks:
```bash
pytest backend/tests/ -v
```
**Results**: `13 passed in ~7.6s` with 100% coverage of core business rules.

---

## 7. Documentation Index

- [System Architecture & Data Flow](docs/architecture.md)
- [Database Design & RDBMS Specification](docs/database-design.md)
- [Optimization Algorithm & Routing Engineering](docs/optimization-algorithm.md)
- [Cloud Security & RBAC Matrix](docs/cloud-security.md)
- [Microsoft Azure Deployment & DP-900 Guide](docs/azure-deployment.md)
- [College Evaluation 10-Minute Presentation Guide](docs/college-presentation-guide.md)

---

## 8. Engineering Limitations & Future Roadmap

- **Volumetric Model vs. 3D Geometric Bin Packing**: The current engine validates aggregate volume ($m^3$) and applies a bottom-heavy LIFO loading sequence heuristic. True 3D geometric orientation (bounding box rotation, pallet interlocking) is planned for v2.0.
- **Routing Mileage**: Leg distances use the spherical Haversine formula based on destination GPS coordinates rather than live traffic routing engines to avoid external paid API dependencies.
