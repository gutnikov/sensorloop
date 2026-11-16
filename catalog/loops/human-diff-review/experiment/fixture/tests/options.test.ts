import { describe, expect, it } from 'vitest';
import { dateOption } from '../src/options.js';

describe('dateOption', () => {
  it('takes a date written YYYY-MM-DD', () => {
    expect(dateOption('--today', '2026-11-01')).toBe('2026-11-01');
  });

  it('names the option and the value it refuses', () => {
    expect(() => dateOption('--today', '2026-1-5')).toThrow('--today: expected a date as YYYY-MM-DD, got 2026-1-5');
    expect(() => dateOption('--today', '2026-02-30')).toThrow('--today: expected a date as YYYY-MM-DD, got 2026-02-30');
  });

  it('refuses a missing value', () => {
    expect(() => dateOption('--today', undefined)).toThrow('--today: expected a date as YYYY-MM-DD, got nothing');
    expect(() => dateOption('--today', '--other')).toThrow('got nothing');
  });
});
