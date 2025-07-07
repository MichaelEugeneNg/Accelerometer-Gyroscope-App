# Define SQLAlchemy ORM models (map table schema to Python classes)
from sqlalchemy import Column, BigInteger, TIMESTAMP, Text, String, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Measurement class inherits from Base class, 
# thereby establishing connection between our model and the database table
class Measurement(Base): 
    __tablename__ = "measurements"
    id           = Column(BigInteger, primary_key=True, index=True)
    user_id      = Column(String, nullable=False)
    measured_at  = Column(TIMESTAMP(timezone=True), nullable=False)
    sensor_type  = Column(Text, nullable=False)
    data         = Column(JSON, nullable=False)
    metrics      = Column(JSON, nullable=True)
