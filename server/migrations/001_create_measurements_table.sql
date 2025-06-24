CREATE TABLE IF NOT EXISTS measurements (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID       NOT NULL,
  measured_at  TIMESTAMPTZ NOT NULL,
  sensor_type  SMALLINT   NOT NULL,
  data         REAL[]     NOT NULL
);
