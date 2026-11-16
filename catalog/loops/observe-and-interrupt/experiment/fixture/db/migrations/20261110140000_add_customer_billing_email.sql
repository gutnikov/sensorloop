-- migrate:up
ALTER TABLE customers ADD COLUMN billing_email varchar(100);

-- migrate:down
ALTER TABLE customers DROP COLUMN billing_email;
