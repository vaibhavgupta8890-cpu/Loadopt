import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import app.models  # Ensure all models are registered with Base.metadata
from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.security import hash_password, create_access_token

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Seed test users
        admin = User(name="Admin", email="admin@test.com", password_hash=hash_password("Admin@123"), role=UserRole.ADMIN.value)
        manager = User(name="Manager", email="manager@test.com", password_hash=hash_password("Manager@123"), role=UserRole.LOGISTICS_MANAGER.value)
        viewer = User(name="Viewer", email="viewer@test.com", password_hash=hash_password("Viewer@123"), role=UserRole.VIEWER.value)
        db.add_all([admin, manager, viewer])
        db.commit()

        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_headers(db_session):
    user = db_session.query(User).filter(User.role == UserRole.ADMIN.value).first()
    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def manager_headers(db_session):
    user = db_session.query(User).filter(User.role == UserRole.LOGISTICS_MANAGER.value).first()
    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def viewer_headers(db_session):
    user = db_session.query(User).filter(User.role == UserRole.VIEWER.value).first()
    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}
