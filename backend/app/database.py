from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

# Engine setup with appropriate connection arguments
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_truck_utilization_view(engine_instance=None):
    """Creates or updates the SQL view for active truck utilization metrics."""
    target_engine = engine_instance or engine
    view_sql = """
    CREATE VIEW IF NOT EXISTS v_truck_utilization AS
    SELECT 
        t.truck_id,
        t.truck_number,
        t.truck_model,
        t.status,
        t.max_weight_kg,
        t.max_volume_m3,
        COALESCE(SUM(p.weight_kg), 0.0) AS total_assigned_weight_kg,
        COALESCE(SUM(p.volume_m3), 0.0) AS total_assigned_volume_m3,
        ROUND(CASE WHEN t.max_weight_kg > 0 THEN (COALESCE(SUM(p.weight_kg), 0.0) / t.max_weight_kg) * 100.0 ELSE 0.0 END, 2) AS weight_utilization_pct,
        ROUND(CASE WHEN t.max_volume_m3 > 0 THEN (COALESCE(SUM(p.volume_m3), 0.0) / t.max_volume_m3) * 100.0 ELSE 0.0 END, 2) AS volume_utilization_pct,
        COUNT(a.assignment_id) AS assigned_package_count
    FROM trucks t
    LEFT JOIN assignments a ON t.truck_id = a.truck_id AND a.assignment_status = 'ACTIVE'
    LEFT JOIN packages p ON a.package_id = p.package_id
    GROUP BY t.truck_id, t.truck_number, t.truck_model, t.status, t.max_weight_kg, t.max_volume_m3;
    """
    try:
        with target_engine.connect() as conn:
            # Handle SQLite syntax
            if "sqlite" in str(target_engine.url):
                conn.execute(text("DROP VIEW IF EXISTS v_truck_utilization;"))
                conn.execute(text(view_sql))
                conn.commit()
            else:
                # SQL Server / Azure SQL syntax
                conn.execute(text("""
                IF OBJECT_ID('v_truck_utilization', 'V') IS NOT NULL
                    DROP VIEW v_truck_utilization;
                """))
                mssql_view_sql = view_sql.replace("CREATE VIEW IF NOT EXISTS", "CREATE VIEW")
                conn.execute(text(mssql_view_sql))
                conn.commit()
    except Exception as e:
        # Non-fatal if view already exists or dialect specific differences occur
        print(f"Notice: v_truck_utilization creation handled: {e}")

def init_db():
    Base.metadata.create_all(bind=engine)
    create_truck_utilization_view(engine)
