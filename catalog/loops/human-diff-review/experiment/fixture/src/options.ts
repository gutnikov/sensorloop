/** A wrong value given on the command line: invoicer prints it and exits with status 2. */
export class UsageError extends Error {}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The value of a date option such as --today: a date that exists, written YYYY-MM-DD. */
export function dateOption(name: string, value: string | undefined): string {
  if (value === undefined || value.startsWith('--')) {
    throw new UsageError(`${name}: expected a date as YYYY-MM-DD, got nothing`);
  }
  const day = new Date(`${value}T00:00:00Z`);
  if (!DATE.test(value) || Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== value) {
    throw new UsageError(`${name}: expected a date as YYYY-MM-DD, got ${value}`);
  }
  return value;
}
