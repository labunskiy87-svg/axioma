ALTER TABLE payout_requests DROP CONSTRAINT payout_requests_status_check;
ALTER TABLE payout_requests ADD CONSTRAINT payout_requests_status_check CHECK (status IN ('pending','approved','transferred','returned','rejected'));
ALTER TABLE payout_requests ADD COLUMN bank_reference text;
ALTER TABLE payout_requests ADD COLUMN transferred_at timestamptz;
ALTER TABLE payout_requests ADD COLUMN transferred_by uuid REFERENCES users(id);
CREATE UNIQUE INDEX payout_requests_bank_reference ON payout_requests(bank_reference) WHERE bank_reference IS NOT NULL;

CREATE TABLE period_acts (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES users(id),
  number text NOT NULL CHECK (length(number) BETWEEN 1 AND 100),
  issued_on date NOT NULL,
  date_from date NOT NULL,
  date_to date NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  file_id uuid NOT NULL REFERENCES files(id),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (date_from <= date_to),
  UNIQUE(customer_id,number)
);
CREATE INDEX period_acts_customer ON period_acts(customer_id,issued_on DESC);
CREATE TABLE period_act_orders (
  act_id uuid NOT NULL REFERENCES period_acts(id),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
  amount bigint NOT NULL CHECK (amount > 0),
  PRIMARY KEY(act_id,order_id)
);
CREATE TABLE period_act_versions (
  act_id uuid NOT NULL REFERENCES period_acts(id),
  revision integer NOT NULL,
  file_id uuid NOT NULL REFERENCES files(id),
  uploaded_by uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(act_id,revision)
);

ALTER TABLE advertisers ADD COLUMN reviewed_at timestamptz;
ALTER TABLE advertisers ADD COLUMN reviewed_by uuid REFERENCES users(id);
ALTER TABLE advertisers ADD COLUMN review_note text NOT NULL DEFAULT '';
CREATE TABLE advertiser_reviews (
  id uuid PRIMARY KEY,
  advertiser_id uuid NOT NULL REFERENCES advertisers(id),
  reviewer_id uuid NOT NULL REFERENCES users(id),
  decision text NOT NULL CHECK (decision IN ('verified','blocked','pending')),
  evidence text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX advertiser_reviews_advertiser ON advertiser_reviews(advertiser_id,created_at DESC);
