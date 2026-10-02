CREATE TABLE reputation_subjects (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  subject_type text NOT NULL CHECK (subject_type IN ('brand','person','company')),
  region text NOT NULL DEFAULT 'Москва' CHECK (length(region) BETWEEN 1 AND 120),
  period_days integer NOT NULL DEFAULT 30 CHECK (period_days IN (7,14,30)),
  official_sources jsonb NOT NULL DEFAULT '[]',
  profile jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reputation_subjects_owner_name ON reputation_subjects(owner_id,lower(name));
CREATE INDEX reputation_subjects_owner_updated ON reputation_subjects(owner_id,updated_at DESC);

CREATE TABLE reputation_queries (
  subject_id uuid NOT NULL REFERENCES reputation_subjects(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 5),
  query text NOT NULL CHECK (length(query) BETWEEN 1 AND 200),
  PRIMARY KEY(subject_id,position),
  UNIQUE(subject_id,query)
);

CREATE TABLE reputation_scans (
  id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES reputation_subjects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','cancelled')),
  parameters jsonb NOT NULL,
  result jsonb,
  error text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);
CREATE INDEX reputation_scans_subject_requested ON reputation_scans(subject_id,requested_at DESC);
CREATE UNIQUE INDEX reputation_scans_one_active ON reputation_scans(subject_id) WHERE status IN ('queued','running');

CREATE TABLE reputation_integrations (
  provider text PRIMARY KEY,
  encrypted_secret text,
  secret_hint text,
  enabled boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  tested_at timestamptz,
  test_status text CHECK (test_status IS NULL OR test_status IN ('success','failed')),
  test_message text
);
