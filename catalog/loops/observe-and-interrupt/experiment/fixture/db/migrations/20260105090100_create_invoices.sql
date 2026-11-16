-- migrate:up
CREATE TABLE invoices (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers (id),
  issued_on date NOT NULL,
  due_on date NOT NULL,
  total_cents bigint NOT NULL,
  paid boolean NOT NULL DEFAULT false
);

-- migrate:down
DROP TABLE invoices;
