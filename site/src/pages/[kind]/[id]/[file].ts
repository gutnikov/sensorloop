// A card's illustration, served beside its page: /sensors/<id>/illustration.svg from catalog/sensors/<id>.svg. The
// image stays in the catalog, next to its card; the build copies it here.
import fs from 'node:fs';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { catalog, kinds } from '../../../lib/content.js';
import { illustrationName } from '../../../lib/present.js';

const TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export function getStaticPaths() {
  const c = catalog();
  return kinds.flatMap((kind) =>
    c[kind]
      .filter((card) => card.illustration)
      .map((card) => ({ params: { kind, id: card.id, file: illustrationName(card) } })),
  );
}

export const GET: APIRoute = ({ params }) => {
  const card = catalog().get(params.kind as 'sensors' | 'tools' | 'loops', params.id!);
  const file = path.join(__CONTENT__.catalogDir, card.illustration!);
  return new Response(fs.readFileSync(file), {
    headers: { 'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream' },
  });
};
