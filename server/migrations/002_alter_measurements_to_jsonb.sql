-- Change sensor_type to accept "accel" / "gyro" so we don't have to map "accel" to 1 and "gyro" to 2
-- Change data from REAL[] (only holds flat array of floats) to a JSONB which can store {ts,x,y,z}
ALTER TABLE measurements
  ALTER COLUMN sensor_type TYPE TEXT, 
  ALTER COLUMN data        TYPE JSONB USING to_jsonb(data);