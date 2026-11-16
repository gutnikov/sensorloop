import type { CategorizedLine } from './categorize.js';

/** One row per line item, in aligned columns: invoice, line, category. */
export function renderCategories(lines: CategorizedLine[]): string {
  const rows = [['Invoice', 'Line', 'Category'], ...lines.map((l) => [l.invoice, l.line, l.category])];
  const widths = rows[0].map((_, col) => Math.max(...rows.map((row) => row[col].length)));
  return `${rows.map((row) => row.map((cell, col) => cell.padEnd(widths[col])).join('  ').trimEnd()).join('\n')}\n`;
}
