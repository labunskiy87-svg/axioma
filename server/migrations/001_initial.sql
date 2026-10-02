CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer','publisher','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE projects (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE advertisers (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  inn text NOT NULL,
  verification text NOT NULL DEFAULT 'pending' CHECK (verification IN ('pending','verified','blocked')),
  UNIQUE(owner_id, inn)
);
CREATE TABLE materials (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  advertiser_id uuid NOT NULL REFERENCES advertisers(id),
  project_id uuid REFERENCES projects(id),
  title text NOT NULL,
  body text NOT NULL,
  format text NOT NULL CHECK (format IN ('article','news','post','longread')),
  metadata jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
  expedited boolean NOT NULL DEFAULT false,
  moderation_reason text,
  version integer NOT NULL DEFAULT 1,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX materials_queue ON materials(status, expedited DESC, submitted_at);
CREATE INDEX materials_owner ON materials(owner_id);
CREATE TABLE outlets (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  url text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('media','telegram','vk','max','dzen')),
  geography text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  prices jsonb NOT NULL,
  coefficient_bps integer NOT NULL DEFAULT 10000 CHECK (coefficient_bps BETWEEN 1000 AND 30000),
  discount_bps integer NOT NULL DEFAULT 0 CHECK (discount_bps BETWEEN 0 AND 9000),
  discount_until date,
  active boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outlets_owner ON outlets(owner_id);
CREATE TABLE accounts (
  id text PRIMARY KEY,
  balance bigint NOT NULL DEFAULT 0,
  CHECK (balance >= 0 OR id = 'external:clearing')
);
INSERT INTO accounts(id) VALUES ('external:clearing'), ('platform:revenue');
CREATE TABLE orders (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES users(id),
  publisher_id uuid NOT NULL REFERENCES users(id),
  material_id uuid NOT NULL REFERENCES materials(id),
  outlet_id uuid NOT NULL REFERENCES outlets(id),
  project_id uuid REFERENCES projects(id),
  snapshot jsonb NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  payout integer NOT NULL CHECK (payout >= 0 AND payout <= amount),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','submitted','completed','rejected','disputed','refunded')),
  publication_url text,
  marking_confirmed boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_customer ON orders(customer_id);
CREATE INDEX orders_publisher ON orders(publisher_id);
CREATE UNIQUE INDEX orders_unique_live ON orders(material_id,outlet_id) WHERE status NOT IN ('rejected','refunded');
CREATE TABLE ledger (
  id uuid PRIMARY KEY,
  debit_account text NOT NULL REFERENCES accounts(id),
  credit_account text NOT NULL REFERENCES accounts(id),
  amount integer NOT NULL CHECK (amount > 0),
  reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (debit_account <> credit_account)
);
CREATE TABLE idempotency (
  actor_id uuid NOT NULL REFERENCES users(id),
  operation text NOT NULL,
  key text NOT NULL,
  request_hash text NOT NULL,
  response jsonb NOT NULL,
  PRIMARY KEY(actor_id, operation, key)
);
CREATE TABLE audit (
  id uuid PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
