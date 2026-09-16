CREATE TABLE files (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  mime text NOT NULL,
  size integer NOT NULL CHECK(size > 0 AND size <= 20971520),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX files_owner ON files(owner_id);
