ALTER TABLE publisher_applications ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS publisher_applications_active_created_idx
  ON publisher_applications(created_at DESC) WHERE deleted_at IS NULL;
