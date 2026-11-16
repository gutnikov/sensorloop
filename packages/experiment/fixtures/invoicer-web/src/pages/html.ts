/** Markup that is safe to send as it is: made by `html`, so it is never escaped again. */
export class Html {
  constructor(readonly text: string) {}
  toString(): string {
    return this.text;
  }
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escape(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function render(value: unknown): string {
  if (value instanceof Html) return value.text;
  if (Array.isArray(value)) return value.map(render).join('');
  if (value === null || value === undefined || value === false) return '';
  return escape(String(value));
}

/**
 * A template tag for markup. Every value is escaped, so data from the invoices file can never become markup; markup
 * made by `html` itself, and lists of it, go in as they are.
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): Html {
  return new Html(strings.reduce((out, s, i) => out + s + (i < values.length ? render(values[i]) : ''), ''));
}
