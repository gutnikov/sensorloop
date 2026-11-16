// The HTTP API: JSON in and out, on PORT (3000 by default), over the database at DATABASE_URL.
import http from 'node:http';
import pg from 'pg';
import { createCustomer, getCustomer, InvalidInput } from './customers.js';
import type { Db } from './db.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db: Db = {
  async query<T>(sql: string, params: unknown[] = []) {
    const result = await pool.query(sql, params);
    return { rows: result.rows as T[] };
  },
};

async function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new InvalidInput('the body must be a JSON object');
  }
}

function send(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function route(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const [, resource, id, field] = new URL(req.url ?? '/', 'http://localhost').pathname.split('/');
  if (resource !== 'customers') return send(res, 404, { error: 'not found' });
  if (req.method === 'POST' && !id) {
    const body = await readJson(req);
    const customer = await createCustomer(db, {
      id: String(body.id ?? ''),
      name: String(body.name ?? ''),
    });
    return send(res, 201, customer);
  }
  if (req.method === 'GET' && id && !field) {
    const customer = await getCustomer(db, id);
    return customer ? send(res, 200, customer) : send(res, 404, { error: `no customer ${id}` });
  }
  send(res, 404, { error: 'not found' });
}

http
  .createServer((req, res) => {
    route(req, res).catch((error: unknown) => {
      if (error instanceof InvalidInput) return send(res, 400, { error: error.message });
      console.error(error);
      send(res, 500, { error: 'internal error' });
    });
  })
  .listen(Number(process.env.PORT ?? 3000));
