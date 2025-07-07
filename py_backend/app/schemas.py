# Use Pydantic model to validate requests and serialize responses
from pydantic import BaseModel
from datetime import datetime
from typing import List, Any, Dict, Optional
from uuid import UUID

# class Reading(BaseModel):
#     sensor: str
#     data: List[List[float]]  # e.g. [[x,y,z], …]

class MeasurementIn(BaseModel):
    userId: str
    measuredAt: datetime
    sensor_type: str           # e.g. "accel" or "gyro"
    data: Any                  # raw IMU buffer, as JSON
    # metrics: Optional[Dict[str, Any]] = None  # e.g. {"stddev": [...]}. This has been commented out because metrics are calculated in the server side, not client side

    model_config = {
        "from_attributes": True
    }

class MeasurementOut(BaseModel):
    id: int
    user_id: UUID
    measured_at: datetime
    sensor_type: str
    data: Any                  # will round-trip the JSON
    metrics: Optional[Any]     # JSON metrics

    model_config = {
        "from_attributes": True
    }