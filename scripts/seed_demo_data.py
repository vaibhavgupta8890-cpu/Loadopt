"""
Seed Demo Data Script for LoadOpt System
Provides realistic demo fleet, packages, users, and scenarios for college evaluation.
Run with: python scripts/seed_demo_data.py [--reset]
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.database import engine, SessionLocal, init_db
from app.models.user import User, UserRole
from app.models.truck import Truck, TruckStatus
from app.models.package import Package, PackagePriority, PackageStatus
from app.models.optimization import Assignment, OptimizationRun, Delivery, Route
from app.models.audit import AuditLog
from app.security import hash_password

def seed_data(reset: bool = False):
    print("==================================================")
    print("      LoadOpt Demo Data Seeding Script            ")
    print("==================================================")

    init_db()
    db = SessionLocal()

    try:
        if reset:
            print("Resetting existing operational records...")
            db.query(Delivery).delete()
            db.query(Route).delete()
            db.query(Assignment).delete()
            db.query(OptimizationRun).delete()
            db.query(AuditLog).delete()
            db.query(Package).delete()
            db.query(Truck).delete()
            db.query(User).delete()
            db.commit()
            print("Database cleared.")

        # 1. Seed Demonstration Users
        demo_users = [
            {
                "name": "Sarah Jenkins (System Admin)",
                "email": "admin@loadopt.io",
                "password": "Admin@123",
                "role": UserRole.ADMIN.value
            },
            {
                "name": "Vikram Malhotra (Fleet Manager)",
                "email": "manager@loadopt.io",
                "password": "Manager@123",
                "role": UserRole.LOGISTICS_MANAGER.value
            },
            {
                "name": "Pooja Sharma (Operations Viewer)",
                "email": "viewer@loadopt.io",
                "password": "Viewer@123",
                "role": UserRole.VIEWER.value
            }
        ]

        for u in demo_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                db_u = User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                    is_active=True
                )
                db.add(db_u)
                print(f"[User Created] {u['role']}: {u['email']} / {u['password']}")

        db.commit()

        # 2. Seed Realistic Trucks (Fleet of 5+ vehicles)
        demo_trucks = [
            {
                "truck_number": "TRK-101",
                "truck_model": "Freightliner Cascadia 126 (Heavy Semi)",
                "max_weight_kg": 20000.0,
                "max_volume_m3": 80.0,
                "status": TruckStatus.AVAILABLE.value,
                "starting_location": "Central Logistics Depot, Delhi"
            },
            {
                "truck_number": "TRK-102",
                "truck_model": "Volvo VNL 760 (Medium Heavy Hauler)",
                "max_weight_kg": 14000.0,
                "max_volume_m3": 60.0,
                "status": TruckStatus.AVAILABLE.value,
                "starting_location": "Central Logistics Depot, Delhi"
            },
            {
                "truck_number": "TRK-103",
                "truck_model": "Isuzu N-Series Box Truck",
                "max_weight_kg": 6500.0,
                "max_volume_m3": 30.0,
                "status": TruckStatus.AVAILABLE.value,
                "starting_location": "Central Logistics Depot, Delhi"
            },
            {
                "truck_number": "TRK-104",
                "truck_model": "Ford F-650 Urban Delivery Van",
                "max_weight_kg": 3500.0,
                "max_volume_m3": 16.0,
                "status": TruckStatus.AVAILABLE.value,
                "starting_location": "Central Logistics Depot, Delhi"
            },
            {
                "truck_number": "TRK-105",
                "truck_model": "Kenworth T680 Reefer (Unavailable / Maintenance)",
                "max_weight_kg": 18000.0,
                "max_volume_m3": 70.0,
                "status": TruckStatus.MAINTENANCE.value,  # Deliberately unavailable
                "starting_location": "Central Logistics Depot, Delhi"
            },
            {
                "truck_number": "TRK-106",
                "truck_model": "Tata Ultra T.7 City Cargo",
                "max_weight_kg": 4500.0,
                "max_volume_m3": 20.0,
                "status": TruckStatus.AVAILABLE.value,
                "starting_location": "Central Logistics Depot, Delhi"
            }
        ]

        for t in demo_trucks:
            existing = db.query(Truck).filter(Truck.truck_number == t["truck_number"]).first()
            if not existing:
                db_t = Truck(**t)
                db.add(db_t)
                print(f"[Truck Created] {t['truck_number']} ({t['truck_model']}) - Status: {t['status']}")

        db.commit()

        # 3. Seed Realistic Packages (18 packages with diverse sizes, weights, and destinations)
        # Note: Package #18 is an oversize heavy turbine that cannot fit any available truck, demonstrating constraint handling.
        now = datetime.utcnow()
        demo_packages = [
            # High Priority Shipments
            {
                "description": "Medical Oxygen Cylinders & Cryogenic Kits",
                "weight_kg": 1200.0,
                "length_cm": 150.0,
                "width_cm": 100.0,
                "height_cm": 120.0,
                "destination": "Gurgaon Sector 18",
                "destination_latitude": 28.4900,
                "destination_longitude": 77.0700,
                "priority": PackagePriority.HIGH.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=8)
            },
            {
                "description": "Critical Pharmaceutical Cold Storage Consignment",
                "weight_kg": 850.0,
                "length_cm": 120.0,
                "width_cm": 90.0,
                "height_cm": 100.0,
                "destination": "Gurgaon Sector 18",
                "destination_latitude": 28.4900,
                "destination_longitude": 77.0700,
                "priority": PackagePriority.HIGH.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=10)
            },
            {
                "description": "Semiconductor Precision Testing Racks",
                "weight_kg": 1600.0,
                "length_cm": 200.0,
                "width_cm": 120.0,
                "height_cm": 180.0,
                "destination": "Noida Phase 2",
                "destination_latitude": 28.5200,
                "destination_longitude": 77.4100,
                "priority": PackagePriority.HIGH.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=12)
            },
            {
                "description": "Aircraft Avionics Replacement Units",
                "weight_kg": 750.0,
                "length_cm": 110.0,
                "width_cm": 80.0,
                "height_cm": 90.0,
                "destination": "Delhi Hub",
                "destination_latitude": 28.6500,
                "destination_longitude": 77.2300,
                "priority": PackagePriority.HIGH.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=6)
            },

            # Medium Priority Shipments
            {
                "description": "Palletized Solar Inverters & Batteries",
                "weight_kg": 3200.0,
                "length_cm": 220.0,
                "width_cm": 140.0,
                "height_cm": 160.0,
                "destination": "Jaipur Industrial",
                "destination_latitude": 26.9300,
                "destination_longitude": 75.8200,
                "priority": PackagePriority.MEDIUM.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=24)
            },
            {
                "description": "Industrial CNC Lathe Components",
                "weight_kg": 4500.0,
                "length_cm": 250.0,
                "width_cm": 160.0,
                "height_cm": 180.0,
                "destination": "Jaipur Industrial",
                "destination_latitude": 26.9300,
                "destination_longitude": 75.8200,
                "priority": PackagePriority.MEDIUM.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=24)
            },
            {
                "description": "Automotive Transmission Assemblies (Batch A)",
                "weight_kg": 2800.0,
                "length_cm": 180.0,
                "width_cm": 120.0,
                "height_cm": 140.0,
                "destination": "Noida Phase 2",
                "destination_latitude": 28.5200,
                "destination_longitude": 77.4100,
                "priority": PackagePriority.MEDIUM.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=36)
            },
            {
                "description": "Commercial Kitchen Refrigeration Units",
                "weight_kg": 1900.0,
                "length_cm": 190.0,
                "width_cm": 110.0,
                "height_cm": 170.0,
                "destination": "Chandigarh Depot",
                "destination_latitude": 30.7400,
                "destination_longitude": 76.7900,
                "priority": PackagePriority.MEDIUM.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=30)
            },
            {
                "description": "Textile Weaving Spindles & Fabrics",
                "weight_kg": 2100.0,
                "length_cm": 160.0,
                "width_cm": 130.0,
                "height_cm": 150.0,
                "destination": "Agra Logistics Park",
                "destination_latitude": 27.2000,
                "destination_longitude": 78.0200,
                "priority": PackagePriority.MEDIUM.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=48)
            },
            {
                "description": "Packaged Ceramic Tiles & Sanitaryware",
                "weight_kg": 3800.0,
                "length_cm": 200.0,
                "width_cm": 150.0,
                "height_cm": 130.0,
                "destination": "Agra Logistics Park",
                "destination_latitude": 27.2000,
                "destination_longitude": 78.0200,
                "priority": PackagePriority.MEDIUM.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=48)
            },

            # Low Priority Shipments
            {
                "description": "Recycled Paper Reels & Cardboard Rolls",
                "weight_kg": 1500.0,
                "length_cm": 170.0,
                "width_cm": 120.0,
                "height_cm": 140.0,
                "destination": "Delhi Hub",
                "destination_latitude": 28.6500,
                "destination_longitude": 77.2300,
                "priority": PackagePriority.LOW.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=72)
            },
            {
                "description": "Bulk Plastic Pellets & Resins",
                "weight_kg": 2200.0,
                "length_cm": 160.0,
                "width_cm": 120.0,
                "height_cm": 130.0,
                "destination": "Gurgaon Sector 18",
                "destination_latitude": 28.4900,
                "destination_longitude": 77.0700,
                "priority": PackagePriority.LOW.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=72)
            },
            {
                "description": "Modular Office Furniture Flatpacks",
                "weight_kg": 1400.0,
                "length_cm": 210.0,
                "width_cm": 110.0,
                "height_cm": 120.0,
                "destination": "Noida Phase 2",
                "destination_latitude": 28.5200,
                "destination_longitude": 77.4100,
                "priority": PackagePriority.LOW.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=60)
            },
            {
                "description": "Consumer Electronics Bulk Cartons",
                "weight_kg": 1100.0,
                "length_cm": 140.0,
                "width_cm": 100.0,
                "height_cm": 110.0,
                "destination": "Chandigarh Depot",
                "destination_latitude": 30.7400,
                "destination_longitude": 76.7900,
                "priority": PackagePriority.LOW.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=50)
            },
            {
                "description": "Agricultural Irrigation Valves & Piping",
                "weight_kg": 2500.0,
                "length_cm": 240.0,
                "width_cm": 130.0,
                "height_cm": 140.0,
                "destination": "Jaipur Industrial",
                "destination_latitude": 26.9300,
                "destination_longitude": 75.8200,
                "priority": PackagePriority.LOW.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=72)
            },
            {
                "description": "Dry Groceries & Canned Food Consignment",
                "weight_kg": 2700.0,
                "length_cm": 180.0,
                "width_cm": 140.0,
                "height_cm": 150.0,
                "destination": "Delhi Hub",
                "destination_latitude": 28.6500,
                "destination_longitude": 77.2300,
                "priority": PackagePriority.LOW.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=60)
            },
            {
                "description": "Retail Apparel & Footwear Pallets",
                "weight_kg": 950.0,
                "length_cm": 130.0,
                "width_cm": 95.0,
                "height_cm": 115.0,
                "destination": "Agra Logistics Park",
                "destination_latitude": 27.2000,
                "destination_longitude": 78.0200,
                "priority": PackagePriority.LOW.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=72)
            },

            # Deliberate Oversize / Overweight Package to demonstrate unassigned diagnostics
            {
                "description": "Heavy Hydroelectric Turbine Rotor (Oversize Cargo)",
                "weight_kg": 26500.0,  # Exceeds TRK-101 (20,000 kg)
                "length_cm": 600.0,
                "width_cm": 350.0,
                "height_cm": 380.0,
                "destination": "Chandigarh Depot",
                "destination_latitude": 30.7400,
                "destination_longitude": 76.7900,
                "priority": PackagePriority.HIGH.value,
                "status": PackageStatus.PENDING.value,
                "requested_delivery_deadline": now + timedelta(hours=12)
            }
        ]

        for p in demo_packages:
            existing = db.query(Package).filter(Package.description == p["description"]).first()
            if not existing:
                vol = round((p["length_cm"] * p["width_cm"] * p["height_cm"]) / 1_000_000.0, 4)
                db_p = Package(volume_m3=vol, **p)
                db.add(db_p)
                print(f"[Package Created] {p['priority']} - {p['description']} ({p['weight_kg']}kg, {vol}m3 to {p['destination']})")

        db.commit()

        # 4. Create an Initial Audit Log entry
        admin_u = db.query(User).filter(User.role == UserRole.ADMIN.value).first()
        audit = AuditLog(
            user_id=admin_u.user_id if admin_u else None,
            action="SEED_DEMO_DATA",
            entity_type="SYSTEM",
            entity_id="ALL",
            details="Seeded initial demo dataset (6 trucks, 18 packages, 3 users)."
        )
        db.add(audit)
        db.commit()

        print("\nDemo data seeding completed successfully!")
        print("--------------------------------------------------")
        print("Demo Accounts:")
        print("  Admin:     admin@loadopt.io    / Admin@123")
        print("  Manager:   manager@loadopt.io  / Manager@123")
        print("  Viewer:    viewer@loadopt.io   / Viewer@123")
        print("--------------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    seed_data(reset=reset_flag)
