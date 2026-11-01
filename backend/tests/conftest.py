import pytest
import os
import sys

os.environ["BCRYPT_ROUNDS"] = "4"

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield

@pytest.fixture
def db():
    session = TestingSessionLocal()
    yield session
    session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_headers(db):
    admin = User(
        email="test.admin@parknexus.com",
        hashed_password=get_password_hash("Pass@123"),
        full_name="Test Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    token = create_access_token(admin.id)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def staff_headers(db):
    staff = User(
        email="test.staff@parknexus.com",
        hashed_password=get_password_hash("Pass@123"),
        full_name="Test Staff",
        role=UserRole.PARKING_STAFF,
        is_active=True
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    token = create_access_token(staff.id)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def customer_headers(db):
    cust = User(
        email="test.customer@parknexus.com",
        hashed_password=get_password_hash("Pass@123"),
        full_name="Test Customer",
        role=UserRole.CUSTOMER,
        is_active=True
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    token = create_access_token(cust.id)
    return {"Authorization": f"Bearer {token}", "user_id": cust.id}
