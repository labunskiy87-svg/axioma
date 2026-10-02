CREATE TABLE reports (
  id uuid PRIMARY KEY,
  number integer GENERATED ALWAYS AS IDENTITY UNIQUE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('project')),
  project_id uuid NOT NULL REFERENCES projects(id),
  date_from date NOT NULL,
  date_to date NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (date_from <= date_to)
);
CREATE INDEX reports_owner_created ON reports(owner_id, created_at DESC);
