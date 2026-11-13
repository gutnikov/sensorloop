// A recorded terminal session, served for the player: /casts/<name>.cast from docs/casts/<name>.cast.
import fs from 'node:fs';
import type { APIRoute } from 'astro';
import { casts } from '../../lib/content.js';

export function getStaticPaths() {
  return casts().map((cast) => ({ params: { file: `${cast.name}.cast` } }));
}

export const GET: APIRoute = ({ params }) => {
  const cast = casts().find((c) => `${c.name}.cast` === params.file);
  if (!cast) return new Response('Not found', { status: 404 });
  return new Response(fs.readFileSync(cast.file), { headers: { 'Content-Type': 'application/x-asciicast' } });
};
