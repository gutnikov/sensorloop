-- migrate:up
CREATE INDEX invoices_customer_id_idx ON invoices (customer_id);

-- migrate:down
DROP INDEX invoices_customer_id_idx;
