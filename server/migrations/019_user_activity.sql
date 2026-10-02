CREATE TABLE user_activity (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  account_owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  attempted_email text,
  method text NOT NULL,
  path text NOT NULL,
  status_code integer NOT NULL,
  ip_address inet,
  user_agent text,
  session_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_activity_actor_created ON user_activity(actor_id, created_at DESC);
CREATE INDEX user_activity_owner_created ON user_activity(account_owner_id, created_at DESC);
CREATE INDEX user_activity_email_created ON user_activity(attempted_email, created_at DESC);
