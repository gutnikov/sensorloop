#!/usr/bin/env node
// Checks the catalog: every card against its schema, and every sensor a card names; then the wizard's tree and personas. Exits 1 with the list of problems.
// Usage: node src/check.js [catalog folder]   (default: the repository's catalog/)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CatalogError, loadCatalog, loadWizard } from './index.js';

const root = path.resolve(
  process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'catalog'),
);

try {
  const catalog = loadCatalog(root);
  console.log(
    `catalog ok: ${catalog.sensors.length} sensors, ${catalog.tools.length} tools, ${catalog.loops.length} loops`,
  );
  const wizard = loadWizard(root, catalog);
  console.log(`wizard ok: ${wizard.tree.questions.length} questions, ${wizard.tree.rules.length} rules, ${wizard.personas.length} personas`);
} catch (error) {
  if (!(error instanceof CatalogError)) throw error;
  console.error(error.message);
  process.exit(1);
}
