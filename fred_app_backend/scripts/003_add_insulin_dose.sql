-- Adds the optional insulin_dose column to glucose readings.
-- Run once in the target database after deploying the change.
ALTER TABLE glucose_readings
ADD COLUMN IF NOT EXISTS insulin_dose DOUBLE PRECISION NULL;
