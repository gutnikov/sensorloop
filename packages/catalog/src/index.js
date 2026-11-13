// @ts-check
/**
 * The catalog: sensors, tools and loops, read from their cards in catalog/, checked against catalog/schema/ and
 * linked to each other. This is the only code that parses cards; the site and the plugin builders import it.
 *
 * A relation is written once, on the more specific card: a tool names the sensors it builds, a loop the sensors it
 * reads. The other direction (a sensor's tools and loops) is computed here and never written on a card.
 */
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

/** @typedef {'sensors' | 'tools' | 'loops'} Kind */

/**
 * @typedef {object} Card
 * @property {Kind} kind
 * @property {string} id                    the file name (a loop: its folder name)
 * @property {string} file                  the card's path inside the catalog folder
 * @property {Record<string, any>} data     the front matter, valid against the kind's schema
 * @property {string} body                  the Markdown after the front matter
 * @property {string | null} illustration   the card's illustration inside the catalog folder, if it has one: the card's
 *                                          path with an image extension (sensors/x.svg, loops/x/card.png)
 */

/**
 * @typedef {object} Catalog
 * @property {Card[]} sensors
 * @property {Card[]} tools
 * @property {Card[]} loops
 * @property {(kind: Kind, id: string) => Card} get    throws CardNotFound
 * @property {(sensor: string) => Card[]} toolsOf      the tools that build a sensor
 * @property {(sensor: string) => Card[]} loopsOf      the loops that read a sensor
 * @property {(loop: Card) => Card[]} toolsFor         the tools a loop can be built with, through its sensors
 */

/** The kinds, in the order they are shown, and the schema each is checked against. */
const KINDS = /** @type {const} */ ({
  sensors: { schema: 'sensor.schema.json', layout: 'file' },
  tools: { schema: 'tool.schema.json', layout: 'file' },
  // A loop is a folder, loops/<id>/card.md, so that its scripts can sit next to its card.
  loops: { schema: 'loop.schema.json', layout: 'folder' },
});

/** @type {Kind[]} */
export const kinds = ['sensors', 'tools', 'loops'];

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Cards are listed by title, read without a leading "The" and possessive: "The project's linter" under L. */
const sortKey = (/** @type {string} */ title) => title.replace(/^the\s+(\S+'s\s+)?/i, '');

/** An illustration is an image beside its card, with the card's name: sensors/test-runner.svg, loops/x/card.png. */
const IMAGE = /\.(svg|png|jpe?g|webp)$/;

/**
 * What an SVG illustration may not carry: it is served from the site's own origin, and an SVG opened on its own runs
 * its scripts there. A guard against the plain ways in, not a sanitizer; the site also serves illustrations with a
 * sandboxing Content-Security-Policy (site/public/_headers).
 */
const SVG_SCRIPTING = [
  [/<([\w-]+:)?script\b/i, 'a <script> element'],
  [/\son[a-z]+\s*=/i, 'an on… event handler'],
  [/\b(xlink:)?href\s*=(?!\s*["']?#)/i, 'a link that is not to #an-element-of-the-svg'],
  [/<([\w-]+:)?(foreignObject|iframe|embed|object)\b/i, 'embedded HTML or objects'],
  [/<([\w-]+:)?(set|animate)\b[^>]*attributeName\s*=\s*["']?(xlink:)?href/i, 'an animated link'],
];
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export class CatalogError extends Error {
  /** @param {string[]} problems  one line each, starting with the card's path */
  constructor(problems) {
    super(`CatalogInvalid: ${problems.length} problem(s)\n${problems.map((p) => `  ${p}`).join('\n')}`);
    this.name = 'CatalogError';
    this.problems = problems;
  }
}

/**
 * Reads the whole catalog. Every problem is collected before it throws, so one run lists them all.
 * @param {string} root  the catalog folder (the one holding sensors/, tools/, loops/ and schema/)
 * @returns {Catalog}
 */
export function loadCatalog(root) {
  /** @type {string[]} */
  const problems = [];
  const ajv = new Ajv2020({ allErrors: true });
  /** @type {Record<Kind, Card[]>} */
  const cards = { sensors: [], tools: [], loops: [] };

  for (const kind of kinds) {
    const { schema, layout } = KINDS[kind];
    const validate = ajv.compile(JSON.parse(fs.readFileSync(path.join(root, 'schema', schema), 'utf8')));

    for (const entry of list(path.join(root, kind), layout, problems, root)) {
      const file = path.relative(root, entry.file);
      if (!ID.test(entry.id)) {
        problems.push(`${file}: "${entry.id}" is not an id: lowercase letters and digits, words joined by hyphens`);
        continue;
      }
      const parsed = parse(fs.readFileSync(entry.file, 'utf8'));
      if ('error' in parsed) {
        problems.push(`${file}: ${parsed.error}`);
        continue;
      }
      if (!validate(parsed.data)) {
        for (const error of validate.errors ?? []) {
          problems.push(`${file}: ${error.instancePath.slice(1) || 'front matter'} ${error.message}`);
        }
        continue;
      }
      const illustration = illustrationOf(entry.file, root, problems);
      cards[kind].push({ kind, id: entry.id, file, data: parsed.data, body: parsed.body, illustration });
    }
    cards[kind].sort((a, b) => sortKey(a.data.title).localeCompare(sortKey(b.data.title)));
  }

  const byId = Object.fromEntries(kinds.map((kind) => [kind, new Map(cards[kind].map((card) => [card.id, card]))]));

  // Every sensor a tool or a loop names must have a card.
  for (const card of [...cards.tools, ...cards.loops]) {
    for (const sensor of card.data.sensors) {
      if (!byId.sensors.has(sensor)) {
        problems.push(`${card.file}: sensors names "${sensor}", which has no card (sensors/${sensor}.md)`);
      }
    }
  }

  if (problems.length > 0) throw new CatalogError(problems);

  /** @param {string} sensor */
  const toolsOf = (sensor) => cards.tools.filter((tool) => tool.data.sensors.includes(sensor));
  /** @param {string} sensor */
  const loopsOf = (sensor) => cards.loops.filter((loop) => loop.data.sensors.includes(sensor));

  return {
    ...cards,
    get(kind, id) {
      const card = byId[kind]?.get(id);
      if (!card) throw new Error(`CardNotFound: no ${kind} card "${id}"`);
      return card;
    },
    toolsOf,
    loopsOf,
    toolsFor: (loop) => cards.tools.filter((tool) => tool.data.sensors.some((s) => loop.data.sensors.includes(s))),
  };
}

/**
 * The cards of one kind: sensors/<id>.md and tools/<id>.md, or loops/<id>/card.md. A missing folder is an empty kind.
 * @param {string} dir
 * @param {'file' | 'folder'} layout
 * @param {string[]} problems
 * @param {string} root
 * @returns {{ id: string, file: string }[]}
 */
function list(dir, layout, problems, root) {
  if (!fs.existsSync(dir)) return [];
  const entries = [];
  // Sorted by code point: the order a directory is read in differs between file systems.
  const dirents = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const dirent of dirents) {
    const where = path.relative(root, path.join(dir, dirent.name));
    if (dirent.name.startsWith('.')) continue;
    if (layout === 'file' && dirent.isFile() && IMAGE.test(dirent.name)) {
      // A card's illustration, picked up with its card; one with no card beside it is a problem.
      const card = dirent.name.replace(IMAGE, '.md');
      if (!fs.existsSync(path.join(dir, card))) problems.push(`${where}: an illustration with no card (${card})`);
      continue;
    }
    if (layout === 'file') {
      if (dirent.isFile() && dirent.name.endsWith('.md')) {
        entries.push({ id: dirent.name.slice(0, -'.md'.length), file: path.join(dir, dirent.name) });
      } else {
        problems.push(`${where}: not a card; a card here is <id>.md`);
      }
    } else {
      const card = path.join(dir, dirent.name, 'card.md');
      if (dirent.isDirectory() && fs.existsSync(card)) {
        entries.push({ id: dirent.name, file: card });
      } else {
        problems.push(`${where}: not a card; a card here is a folder <id>/ with card.md in it`);
      }
    }
  }
  return entries;
}

/**
 * The illustration beside a card: its file name with an image extension instead of .md. Two of them is a problem.
 * @param {string} cardFile  the card's absolute path
 * @param {string} root
 * @param {string[]} problems
 * @returns {string | null}  the illustration's path inside the catalog folder
 */
function illustrationOf(cardFile, root, problems) {
  const dir = path.dirname(cardFile);
  const stem = path.basename(cardFile, '.md');
  const found = fs
    .readdirSync(dir)
    .filter((name) => IMAGE.test(name) && name.replace(IMAGE, '') === stem)
    .sort();
  if (found.length > 1) {
    problems.push(`${path.relative(root, cardFile)}: more than one illustration (${found.join(', ')}); keep one`);
  }
  for (const name of found.filter((n) => n.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(dir, name), 'utf8');
    for (const [pattern, what] of SVG_SCRIPTING) {
      if (pattern.test(svg)) {
        problems.push(`${path.relative(root, path.join(dir, name))}: an SVG illustration may not carry ${what}`);
      }
    }
  }
  return found.length > 0 ? path.relative(root, path.join(dir, found[0])) : null;
}

/**
 * @param {string} text
 * @returns {{ data: Record<string, any>, body: string } | { error: string }}
 */
function parse(text) {
  const match = FRONT_MATTER.exec(text);
  if (!match) return { error: 'no front matter: a card starts with a --- line, its YAML, and another --- line' };
  let data;
  try {
    data = YAML.parse(match[1]);
  } catch (error) {
    return { error: `front matter is not valid YAML: ${/** @type {Error} */ (error).message}` };
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { error: 'front matter is not a mapping of fields' };
  }
  return { data, body: match[2].trim() };
}
