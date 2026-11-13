// The repository's content, as the pages need it: the catalog (loaded, checked and linked by @sensorloop/catalog),
// the metamodel from docs/, and Markdown rendered to HTML. Read on every call, so the dev server shows each edit.
import fs from 'node:fs';
import path from 'node:path';
import { loadCatalog } from '@sensorloop/catalog';
import { marked } from 'marked';

export { kinds } from '@sensorloop/catalog';

export const catalog = () => loadCatalog(__CONTENT__.catalogDir);

/** @param {string} text */
export const markdown = (text) => /** @type {string} */ (marked.parse(text, { async: false }));

/** One line of Markdown (a card's summary or another field), without the paragraph around it. */
export const inline = (/** @type {string} */ text) => /** @type {string} */ (marked.parseInline(text, { async: false }));

/** The line in docs/metamodel.md where Figure 1 goes. */
const FIGURE = '<!-- figure -->';

/**
 * docs/metamodel.md as two pieces of HTML around Figure 1: the title and its lede, and the rest.
 * @returns {{ intro: string, rest: string }}
 */
export function metamodel() {
  const html = markdown(fs.readFileSync(path.join(__CONTENT__.docsDir, 'metamodel.md'), 'utf8'));
  const at = html.indexOf(FIGURE);
  if (at < 0) throw new Error(`MetamodelFigureMissing: docs/metamodel.md has no "${FIGURE}" line for Figure 1`);
  return {
    intro: html.slice(0, at).replace('<p>', '<p class="lede">'),
    rest: html.slice(at + FIGURE.length),
  };
}
