# Create, Read, Update, and/or Delete methods to perform actions on data
# Implements the core data access and business logic functions
from . import models, utils, schemas # Orchestrate calls to models, and use utils to compute metrics
from sqlalchemy.orm import Session # Commit new records via SQLAlchemy sessions

def create_measurements(db: Session, m_in: schemas.MeasurementIn) -> models.Measurement:
    
    # ================ Compute biomarkers ================
    std = utils.compute_stddev(m_in.data)
    max_delta = utils.compute_max_rate_of_change(m_in.data)
    range = utils.compute_range(m_in.data)
    # ====================================================

    # Send in biomarkers as a JSON to 'metrics'
    m = models.Measurement(
        user_id = m_in.userId,
        measured_at = m_in.measuredAt,
        sensor_type = m_in.sensor_type,
        data = m_in.data,
        
        # =========== Store biomarkers in 'metrics' ===========
        metrics = { 
            "stddev": std,
            "max_rate_of_change": max_delta,
            "range": range
        } 
        # =====================================================
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m
