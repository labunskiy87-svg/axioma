CREATE SEQUENCE material_number_seq START WITH 1001;
ALTER TABLE materials ADD COLUMN number integer;
WITH numbered AS (
  SELECT id, (1000 + row_number() OVER (ORDER BY created_at, id))::integer AS number
  FROM materials
)
UPDATE materials SET number = numbered.number FROM numbered WHERE materials.id = numbered.id;
SELECT setval('material_number_seq', COALESCE((SELECT max(number) FROM materials), 1000) + 1, false);
ALTER TABLE materials ALTER COLUMN number SET DEFAULT nextval('material_number_seq');
ALTER TABLE materials ALTER COLUMN number SET NOT NULL;
ALTER TABLE materials ADD CONSTRAINT materials_number_unique UNIQUE (number);
ALTER SEQUENCE material_number_seq OWNED BY materials.number;
