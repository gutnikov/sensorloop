import { describe, expect, it } from 'vitest';
import { parseConfig } from '../src/config.js';

describe('parseConfig', () => {
  it('reads the countries', () => {
    const config = parseConfig(JSON.stringify({ countries: { GB: { currency: 'GBP', vatRate: 0.2 } } }));
    expect(config.countries.GB).toEqual({ currency: 'GBP', vatRate: 0.2 });
  });

  it('refuses a currency it cannot print', () => {
    expect(() => parseConfig(JSON.stringify({ countries: { JP: { currency: 'JPY', vatRate: 0.1 } } }))).toThrow(
      'countries.JP.currency: expected one of USD, GBP, CAD',
    );
  });

  it('refuses a VAT rate that is not a fraction', () => {
    expect(() => parseConfig(JSON.stringify({ countries: { GB: { currency: 'GBP', vatRate: 20 } } }))).toThrow(
      'countries.GB.vatRate',
    );
  });
});
