ALTER TABLE users ADD COLUMN IF NOT EXISTS is_primary_admin boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS users_single_primary_admin_idx ON users(is_primary_admin) WHERE is_primary_admin;
UPDATE users SET is_primary_admin=true WHERE email='admin@axioma.local' AND role='admin' AND account_owner_id IS NULL;

CREATE TABLE IF NOT EXISTS user_two_factor (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  encrypted_secret text,
  pending_secret text,
  pending_expires_at timestamptz,
  enabled_at timestamptz,
  last_counter bigint NOT NULL DEFAULT -1,
  backup_hashes jsonb NOT NULL DEFAULT '[]'::jsonb
);
