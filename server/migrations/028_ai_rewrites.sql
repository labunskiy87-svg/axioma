CREATE TABLE ai_rewrites (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('queued','running','completed','failed')),
  amount integer NOT NULL DEFAULT 3000 CHECK (amount = 3000),
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 minutes',
  completed_at timestamptz
);
CREATE INDEX ai_rewrites_pending ON ai_rewrites(expires_at) WHERE status IN ('queued','running');
