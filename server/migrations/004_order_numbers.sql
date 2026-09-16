CREATE SEQUENCE order_number_seq START WITH 1001;
ALTER TABLE orders ADD COLUMN number integer;
WITH numbered AS (
  SELECT id, (1000 + row_number() OVER (ORDER BY created_at, id))::integer AS number
  FROM orders
)
UPDATE orders SET number = numbered.number FROM numbered WHERE orders.id = numbered.id;
SELECT setval('order_number_seq', COALESCE((SELECT max(number) FROM orders), 1000) + 1, false);
ALTER TABLE orders ALTER COLUMN number SET DEFAULT nextval('order_number_seq');
ALTER TABLE orders ALTER COLUMN number SET NOT NULL;
ALTER TABLE orders ADD CONSTRAINT orders_number_unique UNIQUE (number);
ALTER SEQUENCE order_number_seq OWNED BY orders.number;
