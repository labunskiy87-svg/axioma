CREATE TABLE reputation_cache (
  cache_key text PRIMARY KEY,
  provider text NOT NULL,
  value jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reputation_cache_expires ON reputation_cache(expires_at);
