-- migrate:up
CREATE TABLE line_items (
  id bigserial PRIMARY KEY,
  invoice_id bigint NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(12, 3) NOT NULL,
  unit_price_cents bigint NOT NULL
);
CREATE INDEX line_items_invoice_id_idx ON line_items (invoice_id);

-- migrate:down
DROP TABLE line_items;
