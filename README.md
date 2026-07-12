# TransitOps_BodhiniJain
# 🚛 TransitOps — Smart Transport Operations Platform

TransitOps is a centralized transport operations platform that replaces spreadsheet-and-logbook fleet management with a single system covering vehicle registration, driver compliance, dispatching, maintenance, fuel/expense tracking, and operational analytics — with core dispatch and planning decisions backed by real scheduling algorithms rather than plain CRUD.

---

##  Problem Statement

Many logistics operations still run on spreadsheets and manual logs, leading to:
- Double-booked vehicles and drivers
- Underutilized fleet capacity
- Missed maintenance windows
- Expired driver licenses going unnoticed
- Inaccurate expense tracking
- No real visibility into fleet-wide operational cost or ROI

TransitOps digitizes the full lifecycle — from vehicle registration to trip dispatch to cost reporting — while enforcing the business rules that spreadsheets can't.

---

##  Target Users

| Role | Responsibility |
|---|---|
| **Fleet Manager** | Oversees vehicle assets, maintenance, and fleet-wide efficiency |
| **Driver** | Creates trips, gets assigned vehicles, monitors active deliveries |
| **Safety Officer** | Tracks license validity, driver compliance, and safety scores |
| **Financial Analyst** | Reviews expenses, fuel cost, maintenance cost, and profitability |

Access is role-based (RBAC) — each role sees and can act on only what's relevant to them.

---

##  Core Features

-  JWT authentication with Role-Based Access Control
-  Live dashboard: Active/Available Vehicles, Vehicles in Maintenance, Active/Pending Trips, Drivers on Duty, Fleet Utilization %
-  Vehicle registry with unique registration numbers and lifecycle status (Available / On Trip / In Shop / Retired)
-  Driver profiles with license tracking and status (Available / On Trip / Off Duty / Suspended)
-  Trip lifecycle management: Draft → Dispatched → Completed → Cancelled, with automatic status propagation to vehicle and driver
-  Maintenance workflow that automatically pulls a vehicle out of the dispatch pool
-  Fuel and expense logging with automatic operational cost rollups
-  Analytics: Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle ROI
-  CSV export on reports and registries
-  Two algorithmic planning tools (below) that turn raw trip data into fleet-sizing and capacity decisions

---

##  Algorithmic Core (why this isn't just CRUD)

Four of the platform's decisions are backed by named algorithms instead of ad-hoc logic, because the underlying business questions are genuinely scheduling/optimization problems:

### 1. Smart Fleet Sizing — *Interval Partitioning*
**Question answered:** "Given today's planned trips, what's the minimum number of vehicles required to run all of them without a time conflict?"
Trips are sorted by start time; a min-heap tracks the earliest-freeing vehicle. A trip reuses a vehicle if the heap's minimum end-time is ≤ its own start time, otherwise a new vehicle is allocated. This is the same structure as the classic "minimum meeting rooms" problem, running in **O(n log n)**.
Surfaced live on the Fleet Manager's dashboard.

### 2. Capacity Planner — *Binary Search on the Answer*
**Question answered:** "If I only have K vehicles available, what's the minimum load capacity per vehicle needed to still serve every trip?"
Binary search runs over the possible capacity range (largest single cargo weight → total cargo weight across all trips), with a greedy bin-packing feasibility check at each midpoint confirming whether K vehicles of that capacity suffice. Runs in **O(n log(ΣweightK))**.
Used for fleet procurement/rental decisions on the Reports page.

### 3. Dispatch Suggestion — *Greedy Assignment*
**Question answered:** "Which available vehicle and driver should this new trip actually go to?"
Candidates are first filtered through all mandatory business rules, then ranked by tightest capacity fit (least wasted load capacity) with odometer/safety-score tiebreaks, so dispatch suggestions are efficient rather than arbitrary.

### 4. Compliance Queues — *Min-Heaps*
**Question answered:** "What licenses or maintenance windows are coming due soonest?"
Two min-heaps (keyed by license expiry and maintenance due date) give the Safety Officer an always-sorted, O(log n)-per-update view without re-sorting the full table on every load.

---

##  Mandatory Business Rules

All enforced server-side in a single centralized validation layer:

1. Vehicle registration number must be unique.
2. Retired or In Shop vehicles never appear in dispatch selection.
3. Drivers with expired licenses or Suspended status cannot be assigned to trips.
4. A vehicle or driver already On Trip cannot be assigned to another trip.
5. Cargo weight must not exceed the assigned vehicle's maximum load capacity.
6. Dispatching a trip sets both vehicle and driver status to On Trip.
7. Completing a trip restores both to Available and logs final odometer/fuel.
8. Cancelling a dispatched trip restores vehicle and driver to Available.
9. Creating an active maintenance record sets the vehicle to In Shop.
10. Closing maintenance restores the vehicle to Available (unless Retired).

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + RBAC middleware |
| Charts | Recharts |
| Export | papaparse / json2csv |

---

## 📁 Project Structure

```
transitops/
├── backend/
│   └── src/
│       ├── config/          # DB connection, env
│       ├── models/          # Mongoose schemas
│       ├── middleware/      # auth, RBAC, error handling
│       ├── controllers/     # request handlers
│       ├── services/        # business logic + DSA modules
│       ├── routes/          # API endpoints
│       └── utils/           # MinHeap, CSV export, logger
├── frontend/
│   └── src/
│       ├── api/              # axios client
│       ├── auth/             # auth context, protected routes
│       ├── components/       # feature-organized UI components
│       ├── pages/            # route-level pages
│       └── hooks/
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
npm install
cp .env.example .env    # set MONGO_URI, JWT_SECRET, PORT
npm run seed             # populate demo data
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and the API at `http://localhost:5000` (or your configured port).

### Demo Login
After seeding, use the credentials printed by `npm run seed` (one account per role: Fleet Manager, Driver, Safety Officer, Financial Analyst).

---

##  Example Workflow

1. Register vehicle `Van-05` — max capacity 500 kg, status `Available`
2. Register driver `Alex` with a valid license
3. Create a trip with cargo weight 450 kg
4. System validates `450 ≤ 500` and allows dispatch
5. Vehicle and driver automatically flip to `On Trip`
6. Complete the trip — enter final odometer and fuel consumed
7. Both flip back to `Available`
8. Log a maintenance record (e.g. Oil Change) — vehicle automatically becomes `In Shop` and disappears from dispatch options
9. Reports update operational cost and fuel efficiency using the new trip/fuel data

---

##  Database Entities

`Users` · `Vehicles` · `Drivers` · `Trips` · `MaintenanceLogs` · `FuelLogs` · `Expenses`

---

##  Reports & Analytics Formulas

- **Fuel Efficiency** = Distance / Fuel Consumed
- **Fleet Utilization** = (Vehicles On Trip / Total Active Vehicles) × 100
- **Operational Cost** = Fuel Cost + Maintenance Cost (per vehicle)
- **Vehicle ROI** = (Revenue − (Maintenance + Fuel)) / Acquisition Cost

---


##  Team

- **Bodhini Jain** 
- **Kartikeya Jain** 



---

## 📄 License

This project was built for hackathon evaluation purposes. Add a license (MIT recommended) if open-sourcing beyond the event.
