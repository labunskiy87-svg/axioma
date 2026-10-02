ALTER TABLE order_messages ADD COLUMN recipient_id uuid REFERENCES users(id);
ALTER TABLE order_messages ADD COLUMN kind text NOT NULL DEFAULT 'message'
  CHECK (kind IN ('message','evidence_request'));
CREATE INDEX order_messages_recipient_idx ON order_messages(order_id,recipient_id,kind);
