#!/bin/bash
# The script runs in the empty workspace and cannot read the case's folder, so it writes every file itself.
set -e
# A small Node service: an orders API with tests (node --test), CI on GitHub Actions that runs them, a deploy to
# Fly.io by hand (npm run deploy), whose release command runs the migrations against the production database.
# No linter, no type check. Everything the interview could ask about the commands, CI and deploy is in the repo.
mkdir -p src test migrations scripts .github/workflows
cat > package.json <<'JSON'
{
  "name": "orders",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test test/",
    "migrate": "node scripts/migrate.js",
    "deploy": "fly deploy"
  }
}
JSON
cat > src/orders.js <<'JS'
export function total(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
JS
cat > src/server.js <<'JS'
import http from 'node:http';
import { total } from './orders.js';

http
  .createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/orders/total') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ total: total(JSON.parse(body).items) }));
      });
      return;
    }
    res.statusCode = 404;
    res.end();
  })
  .listen(process.env.PORT ?? 3000);
JS
cat > test/orders.test.js <<'JS'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total } from '../src/orders.js';

test('sums price times quantity', () => {
  assert.equal(total([{ price: 3, quantity: 2 }, { price: 1, quantity: 1 }]), 7);
});
JS
cat > migrations/001_orders.sql <<'SQL'
CREATE TABLE orders (id serial PRIMARY KEY, customer_id int NOT NULL, total_cents int NOT NULL);
SQL
cat > scripts/migrate.js <<'JS'
// Applies migrations/*.sql in order to the database at DATABASE_URL: production, when the deploy runs it.
console.log('migrate: would apply migrations to', process.env.DATABASE_URL ?? '(DATABASE_URL not set)');
JS
cat > fly.toml <<'TOML'
app = "orders-api"

[deploy]
  release_command = "npm run migrate"

[http_service]
  internal_port = 3000
TOML
cat > .github/workflows/test.yml <<'YML'
name: test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm test
YML
printf '# orders\n\nThe orders API of our shop.\n\n- `npm test` runs the tests; CI runs them on every push.\n- `npm run deploy` deploys to Fly.io; the deploy runs the migrations against the production database first.\n' > README.md
printf 'node_modules/\n' > .gitignore
git init -q && git add -A && git -c user.name=dev -c user.email=dev@example.invalid commit -qm 'orders: the API'
