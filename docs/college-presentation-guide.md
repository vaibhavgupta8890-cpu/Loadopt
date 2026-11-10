# LoadOpt — College Evaluation & Project Defense Presentation Guide

## 1. Evaluation Overview
This guide provides a structured **10-Minute Live Demonstration Script** for presenting **LoadOpt — Smart Truck Loading and Delivery Optimization System** to faculty evaluators and technical examiners.

It directly demonstrates the 6 required academic competencies:
1. **System Design**: 3-Tier decoupled architecture with RESTful communication.
2. **RDBMS**: Normalized tables, check constraints, foreign keys, and SQL view `v_truck_utilization`.
3. **DP-900 (Azure Data Fundamentals)**: Relational data modeling, ACID transactions, and Azure SQL readiness.
4. **Cloud Security**: BCrypt hashing, JWT tokens, RBAC matrix, and audit logging.
5. **Data Structures & Algorithms**: Heuristic multi-capacity knapsack, LIFO reverse-delivery loading order, and Haversine nearest-neighbor routing.
6. **Full-Stack Web Development**: React 19, Vite, Tailwind CSS v4, Lucide icons, Recharts, and FastAPI.

---

## 2. Step-by-Step 10-Minute Presentation Script

### Minute 0–1: Introduction & Problem Statement
- **What to say**:
  > *"Good morning, respected evaluators. In modern logistics, manual truck allocation leads to two major inefficiencies: underutilized freight capacity (costing money) and capacity violations (causing axle damage or safety citations). LoadOpt solves this by automating truck assignment under dual weight and volume constraints, generating physically sensible loading orders, and sequencing multi-destination deliveries."*
- **Screen**: Show the Login screen (`http://localhost:5173/login`). Point out the one-click evaluator demo accounts for Admin, Logistics Manager, and Viewer.

### Minute 1–2: Security & Authentication (Cloud Security)
- **Action**: Click the **Admin** pill (`admin@loadopt.io` / `Admin@123`) and click **Sign In**.
- **What to say**:
  > *"Our authentication layer uses BCrypt with 12 salt rounds on the backend. When logged in, a cryptographically signed JWT token is issued. System authorization is enforced through Role-Based Access Control (RBAC). For example, Viewers can inspect dashboards but receive an HTTP 403 Forbidden on the backend if attempting write operations."*

### Minute 2–4: Operational Dashboard & RDBMS (System Design & DP-900)
- **Screen**: Navigate to **Dashboard** (`/dashboard`).
- **What to say**:
  > *"The dashboard displays live KPIs aggregated directly from our relational database records—not hardcoded values. We observe total trucks, package counts, and live average weight and volume utilization. The bar chart compares payload weight versus volume per truck, while the pie charts show cargo priority breakdown and audit activity."*

### Minute 4–6: Core Feature: Load Optimization Engine (Algorithms & Heuristics)
- **Action**: Navigate to **Load Optimization** (`/optimization`).
- **What to say**:
  > *"This is the core algorithm module. In logistics, vehicle assignment is an NP-hard Multi-Capacity Multi-Knapsack Problem. We have implemented a constraint-aware heuristic that considers priority, destination clustering affinity, and capacity tightness."*
- **Action**: Click **Run Optimization**.
- **Points to highlight**:
  1. **Truck Payload Cards**: Show that no truck exceeds 100% of its weight or volume capacity.
  2. **Unassigned Package Diagnostics**: Switch to the **Unassigned Diagnostics** tab. Show that the *Heavy Hydroelectric Turbine (26,500 kg)* is flagged as unassigned because it exceeds the fleet maximum single capacity (20,000 kg). Evaluators love that the algorithm transparently explains why an item could not fit!
  3. **Loading Order (LIFO) Sequence**: Switch to the **Loading Order** tab. Explain that items for the final stop are loaded first at the front of the truck bed, and heavier items are placed at the bottom for center of gravity stability.

### Minute 6–7: Delivery Sequence Planning
- **Action**: Navigate to **Delivery Planning** (`/delivery`).
- **What to say**:
  > *"Once packages are assigned, our delivery engine plans the route using a Priority-Weighted Nearest Neighbor heuristic starting from the base depot. Distances are calculated using the spherical Haversine formula across waypoint coordinates, providing estimated trip mileage and driving transit time."*

### Minute 7–8: What-If Simulation Lab
- **Action**: Navigate to **What-If Simulation** (`/simulation`).
- **What to say**:
  > *"In real logistics, conditions change dynamically. What happens if our largest semi-truck breaks down? Instead of guessing, we run a non-destructive What-If simulation."*
- **Action**: Select **Scenario A: Truck Breakdown** &rarr; Select `TRK-101` &rarr; Click **Run Simulation**.
- **Points to highlight**:
  - Show the **Delta Comparison**: The system displays how cargo was redistributed or displaced without modifying the live database.
  - Explain that only clicking **Apply Revised Plan** will commit changes transactionally to the database.

### Minute 8–9: Reports & CSV Export
- **Action**: Navigate to **Reports & Analytics** (`/reports`).
- **Action**: Click **Trucks CSV** or **Active Assignments CSV**.
- **What to say**:
  > *"Reports can be streamed directly as CSV files for operational records or ingested into Microsoft Power BI via our analytical SQL view `v_truck_utilization`."*

### Minute 9–10: Automated Tests & Cloud Architecture Defense
- **Action**: Show terminal running `pytest backend/tests/ -v` (13 passed tests).
- **What to say**:
  > *"To ensure engineering integrity, all 13 unit tests pass, validating capacity limits, uniqueness constraints, RBAC permissions, and transactional rollbacks. The application is cloud-ready for Microsoft Azure App Service and Azure SQL Database."*
- **Conclusion**: Invite examiner questions.
