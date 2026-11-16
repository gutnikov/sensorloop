/** The categories accounting books a line item to. The prompt explains each one. */
export const CATEGORIES = ['Consulting', 'Training', 'Support', 'Software', 'Hardware', 'Rebilled expenses'] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}
