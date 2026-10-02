ALTER TABLE account_settings DROP CONSTRAINT account_settings_requisites_status_check;
ALTER TABLE account_settings ADD CONSTRAINT account_settings_requisites_status_check
  CHECK (requisites_status IN ('draft','pending','verified','rejected'));
ALTER TABLE account_settings ADD COLUMN requisites_reviewer_id uuid REFERENCES users(id);
ALTER TABLE account_settings ADD COLUMN requisites_review_comment text NOT NULL DEFAULT '';
ALTER TABLE account_settings ADD COLUMN requisites_reviewed_at timestamptz;
