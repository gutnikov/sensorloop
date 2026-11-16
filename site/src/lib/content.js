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

/**
 * A recorded terminal session in a doc: `<!-- cast: <name> | <caption> -->` on a line of its own, for the file
 * docs/casts/<name>.cast (asciinema's format), served at /casts/<name>.cast. Until the file exists, a frame says where
 * it goes.
 */
const CAST = /<!--\s*cast:\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*(?:\|\s*(.*?))?\s*-->/g;

const escapeHtml = (/** @type {string} */ text) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** @param {string} html */
function withCasts(html) {
  return html.replace(CAST, (_, name, caption) => {
    const figcaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';
    if (!fs.existsSync(path.join(__CONTENT__.docsDir, 'casts', `${name}.cast`))) {
      return (
        `<figure class="cast is-empty"><div class="cast-empty"><span>No recording yet</span>` +
        `<code>docs/casts/${name}.cast</code></div>${figcaption}</figure>`
      );
    }
    return `<figure class="cast" data-cast="/casts/${name}.cast"><div class="cast-player"></div>${figcaption}</figure>`;
  });
}

/** The recordings in docs/casts/, by name. */
export function casts() {
  const dir = path.join(__CONTENT__.docsDir, 'casts');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.cast'))
    .map((file) => ({ name: file.slice(0, -'.cast'.length), file: path.join(dir, file) }));
}

/**
 * A doc from docs/ as two pieces of HTML: its title and first paragraph (the lede), and the rest.
 * @param {string} name  the file name without .md
 * @returns {{ intro: string, rest: string }}
 */
export function doc(name) {
  const html = withCasts(markdown(fs.readFileSync(path.join(__CONTENT__.docsDir, `${name}.md`), 'utf8')));
  const end = html.indexOf('</p>') + '</p>'.length;
  return { intro: html.slice(0, end).replace('<p>', '<p class="lede">'), rest: html.slice(end) };
}

/** The line in docs/metamodel.md where Figure 1 goes. */
const FIGURE = '<!-- figure -->';

/**
 * docs/metamodel.md as two pieces of HTML around Figure 1: the title and its lede, and the rest.
 * @returns {{ intro: string, rest: string }}
 */
export function metamodel() {
  const html = withCasts(markdown(fs.readFileSync(path.join(__CONTENT__.docsDir, 'metamodel.md'), 'utf8')));
  const at = html.indexOf(FIGURE);
  if (at < 0) throw new Error(`MetamodelFigureMissing: docs/metamodel.md has no "${FIGURE}" line for Figure 1`);
  return {
    intro: html.slice(0, at).replace('<p>', '<p class="lede">'),
    rest: html.slice(at + FIGURE.length),
  };
}
