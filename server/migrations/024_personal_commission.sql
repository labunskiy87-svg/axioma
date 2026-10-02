ALTER TABLE users ADD COLUMN personal_commission_bps integer CHECK (personal_commission_bps BETWEEN 0 AND 10000);
ALTER TABLE topup_invoices ADD COLUMN commission_bps integer NOT NULL DEFAULT 1500 CHECK (commission_bps BETWEEN 0 AND 10000);
