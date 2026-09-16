CREATE TABLE order_messages (
 id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES orders(id), author_id uuid NOT NULL REFERENCES users(id),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 10000), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_messages_order ON order_messages(order_id,created_at);
CREATE TABLE tickets (
 id uuid PRIMARY KEY, number integer GENERATED ALWAYS AS IDENTITY UNIQUE,
 owner_id uuid NOT NULL REFERENCES users(id), subject text NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ticket_messages (
 id uuid PRIMARY KEY,ticket_id uuid NOT NULL REFERENCES tickets(id),author_id uuid NOT NULL REFERENCES users(id),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 10000),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE informers (
 id uuid PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE SEQUENCE dispute_number_seq START 1001;
ALTER TABLE orders ADD COLUMN dispute_number integer UNIQUE;
UPDATE orders SET dispute_number=nextval('dispute_number_seq') WHERE status IN ('disputed','refunded');
