ALTER TABLE reputation_integrations
  ADD COLUMN test_details jsonb NOT NULL DEFAULT '[]'::jsonb;
