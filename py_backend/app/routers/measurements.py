# Defines an APIRouter for the endpoint /api/measurements (mounted in main.py)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from .. import schemas, models, crud, database
from ..database import get_db

router = APIRouter()

# def get_db():
#     db = database.SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# POST method at api/measurements endpoint
@router.post("/", status_code=201)
def post_measurement(
    m_in: schemas.MeasurementIn, 
    db: Session = Depends(get_db)
) -> Any:
    crud.create_measurements(db, m_in)
    return {"success": True}

# GET method at api/measurements endpoint
@router.get("/", response_model=List[schemas.MeasurementOut], summary="Fetch 8 most recent measurements",)
def read_recent_measurements(db: Session = Depends(get_db)):
    measurements = (
        db.query(models.Measurement)
          .order_by(models.Measurement.id.desc())
          .limit(8)
          .all()
    )
    if not measurements:
        # Return an empty list rather than a 404
        return []
    return measurements

# GET method at api/measurements/metrics endpoint
@router.get("/metrics", response_model=List[schemas.MeasurementMetrics], summary="Fetch sensor_type & metrics for 8 most recent measurements",)
def read_recent_metrics(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Measurement)
          .order_by(models.Measurement.id.desc())
          .limit(8)
          .all()
    )
    return rows
