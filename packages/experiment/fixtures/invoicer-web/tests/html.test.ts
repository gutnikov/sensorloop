import { describe, expect, it } from 'vitest';
import { html } from '../src/pages/html.js';

describe('html', () => {
  it('escapes the values it is given', () => {
    expect(html`<td>${'Fennel & Finch <Studio>'}</td>`.text).toBe('<td>Fennel &amp; Finch &lt;Studio&gt;</td>');
  });

  it('keeps markup made by html, and lists of it', () => {
    const items = ['a', 'b'].map((x) => html`<li>${x}</li>`);
    expect(html`<ul>${items}</ul>`.text).toBe('<ul><li>a</li><li>b</li></ul>');
  });

  it('leaves out nothing-values', () => {
    expect(html`<p>${undefined}${null}${false}</p>`.text).toBe('<p></p>');
  });
});
