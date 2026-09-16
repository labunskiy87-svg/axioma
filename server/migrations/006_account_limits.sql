ALTER TABLE users ADD COLUMN order_limit bigint CHECK (order_limit IS NULL OR order_limit >= 0);
CREATE TABLE favorite_outlets (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id,outlet_id)
);
