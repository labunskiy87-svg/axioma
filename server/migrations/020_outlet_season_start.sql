ALTER TABLE outlets ADD COLUMN season_start date;
ALTER TABLE outlets ADD CONSTRAINT outlet_season_dates CHECK (season_start IS NULL OR (discount_until IS NOT NULL AND season_start <= discount_until));
