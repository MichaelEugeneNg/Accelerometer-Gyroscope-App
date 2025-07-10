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

    model_config = {
        "from_attributes": True
    }

class MeasurementOut(BaseModel):
    id: int
    user_id: UUID
    measured_at: datetime
    sensor_type: str
    data: Any
    metrics: Optional[Any]

    model_config = {
        "from_attributes": True
    }

# This is used for the GET method at the "api/measurements/metrics" endpoint
class MeasurementMetrics(BaseModel):
    id: int
    sensor_type: str
    metrics: Any

    model_config = {
        "from_attributes": True
    }