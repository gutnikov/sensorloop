// How a card is shown: the names of the kinds, a card's address, and the facts listed under its title (with the
// relations the catalog computes, such as a sensor's tools and loops).
import { config } from '../config.mjs';
import { inline } from './content.js';

/** Each kind has its own page, /sensors/, /tools/ and /loops/, with the lede below its title. */
export const KIND = {
  sensors: {
    one: 'Sensor',
    many: 'Sensors',
    lede:
      'A sensor observes a change, or the system the change lives in, and reports a signal about its quality: ' +
      'pass or fail, a score, or a list of findings. It never changes the work.',
  },
  tools: {
    one: 'Tool',
    many: 'Tools',
    lede:
      'What the sensors are built with. Each tool is described for any project: one tied to a language is the ' +
      'role it plays, found in the project, with products named only as examples.',
  },
  loops: {
    one: 'Loop',
    many: 'Loops',
    lede:
      'A loop connects a sensor to the work: when the sensor is read, what counts as a failure, and what happens ' +
      'next.',
  },
};

/** A kind's page. */
export const kindHref = (/** @type {string} */ kind) => `/${kind}/`;

/** @param {{ kind: string, id: string }} card */
export const href = (card) => `/${card.kind}/${card.id}/`;

/** The card's file in the repository. */
export const source = (/** @type {{ file: string }} */ card) =>
  `${config.repository}/blob/${config.branch}/catalog/${card.file}`;

const escape = (/** @type {string} */ text) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Links to cards, or a muted "none yet". */
const links = (/** @type {any[]} */ cards) =>
  cards.length > 0
    ? cards.map((card) => `<a href="${href(card)}">${escape(card.data.title)}</a>`).join(', ')
    : '<span class="none">none yet</span>';

/** The line above a card's title. */
export function kicker(card) {
  const detail = { sensors: card.data.type, loops: card.data.placement }[card.kind];
  return detail ? `${KIND[card.kind].one} · ${detail}` : KIND[card.kind].one;
}

/** The short facts of a card in the catalog's list. */
export function meta(catalog, card) {
  switch (card.kind) {
    case 'sensors':
      return [['type', card.data.type], ['tools', catalog.toolsOf(card.id).length], ['loops', catalog.loopsOf(card.id).length]];
    case 'tools':
      return [['builds', card.data.sensors.map((id) => catalog.get('sensors', id).data.title).join(', ')]];
    case 'loops':
      return [['reads', card.data.sensors.map((id) => catalog.get('sensors', id).data.title).join(', ')], ['runs', card.data.placement]];
  }
}

/** The facts under a card's title, as label and HTML. */
export function facts(catalog, card) {
  const sensors = () => links(card.data.sensors.map((id) => catalog.get('sensors', id)));
  switch (card.kind) {
    case 'sensors':
      return [
        ['Type', escape(card.data.type)],
        ['Signal', inline(card.data.signal)],
        ['Tools', links(catalog.toolsOf(card.id))],
        ['Loops', links(catalog.loopsOf(card.id))],
      ];
    case 'tools':
      return [
        ['Builds', sensors()],
        ...(card.data.homepage ? [['Homepage', `<a href="${escape(card.data.homepage)}">${escape(card.data.homepage)}</a>`]] : []),
      ];
    case 'loops':
      return [
        ['Reads', sensors()],
        ['Runs', card.data.placement === 'inner' ? 'inner: before the push' : 'outer: after the push'],
        ['When', inline(card.data.when)],
        ['Failure', inline(card.data.failure)],
        ['Next', inline(card.data.next)],
        ['Tools', links(catalog.toolsFor(card))],
      ];
  }
}
