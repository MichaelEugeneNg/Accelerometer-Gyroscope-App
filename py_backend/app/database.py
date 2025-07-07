# Load DATABASE_URL, create SQLAlchemy engine (database connection resource)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Create the engine
engine = create_engine(os.getenv("DATABASE_URL"), echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for FastAPI
def get_db():
    """
    Yields a SQLAlchemy Session, and ensures it’s closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()