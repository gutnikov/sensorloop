-- migrate:up
CREATE TABLE invoices (
  id bigserial PRIMARY KEY,
  number text NOT NULL UNIQUE,
  customer_id bigint NOT NULL REFERENCES customers (id),
  issued_on date NOT NULL,
  due_on date NOT NULL,
  tax_rate numeric(5, 4) NOT NULL,
  total_cents bigint NOT NULL,
  paid boolean NOT NULL DEFAULT false
);

-- migrate:down
DROP TABLE invoices;
