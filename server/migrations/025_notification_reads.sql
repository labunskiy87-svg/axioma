CREATE TABLE notification_reads (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_key text NOT NULL CHECK (length(notification_key) BETWEEN 1 AND 160),
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_key)
);
