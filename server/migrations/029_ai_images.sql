CREATE TABLE ai_images (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('queued','running','completed','failed')),
  amount integer NOT NULL DEFAULT 5000 CHECK (amount = 5000),
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '5 minutes',
  completed_at timestamptz
);
CREATE INDEX ai_images_pending ON ai_images(expires_at) WHERE status IN ('queued','running');
