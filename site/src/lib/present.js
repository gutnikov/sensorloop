// How a card is shown: the names of the kinds, a card's address, and the facts listed under its title (with the
// relations the catalog computes, such as a sensor's tools and loops).
import { config } from '../config.mjs';
import { inline } from './content.js';

export const KIND = {
  sensors: {
    one: 'Sensor',
    many: 'Sensors',
    description: 'What observes a change and reports a signal about its quality.',
  },
  tools: {
    one: 'Tool',
    many: 'Tools',
    description: 'The programs and services the sensors are built with.',
  },
  loops: {
    one: 'Loop',
    many: 'Loops',
    description: 'A sensor connected to the work: when it is read, what counts as a failure, what happens next.',
  },
};

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
  const detail = { sensors: card.data.type, tools: card.data.stacks?.join(', '), loops: card.data.placement }[card.kind];
  return `${KIND[card.kind].one} · ${detail}`;
}

/** The short facts of a card in the catalog's list. */
export function meta(catalog, card) {
  switch (card.kind) {
    case 'sensors':
      return [['type', card.data.type], ['tools', catalog.toolsOf(card.id).length], ['loops', catalog.loopsOf(card.id).length]];
    case 'tools':
      return [['builds', card.data.sensors.map((id) => catalog.get('sensors', id).data.title).join(', ')], ['stack', card.data.stacks.join(', ')]];
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
        ['Stack', escape(card.data.stacks.join(', '))],
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
