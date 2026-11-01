import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

# Check engine setup
engine_args = {}
if db_url.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args["pool_pre_ping"] = True
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20

try:
    engine = create_engine(db_url, **engine_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(f"Could not connect to configured DATABASE_URL ({db_url}): {e}. Falling back to SQLite.")
    db_url = "sqlite:///./parknexus.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
