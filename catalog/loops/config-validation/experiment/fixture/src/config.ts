import { readFileSync } from 'node:fs';
import { CURRENCIES, type Currency } from './types.js';

/** What invoicer needs to know about a country we invoice. */
export interface Country {
  currency: Currency;
  /** The VAT an invoice gets when it sets no taxRate: a fraction, 0.2 is 20 %. */
  vatRate: number;
}

export interface Config {
  /** By ISO 3166-1 alpha-2 code, such as GB. */
  countries: Record<string, Country>;
}

/** A problem with the configuration file, reported to the user as it is. */
export class ConfigError extends Error {}

/** Where the configuration is: the file INVOICER_CONFIG names, or invoicer.config.json in the current folder. */
export function configPath(): string {
  return process.env.INVOICER_CONFIG || 'invoicer.config.json';
}

function country(raw: any, where: string): Country {
  if (!CURRENCIES.includes(raw?.currency)) throw new ConfigError(`${where}.currency: expected one of ${CURRENCIES.join(', ')}`);
  const vatRate = raw.vatRate;
  if (typeof vatRate !== 'number' || !(vatRate >= 0 && vatRate < 1)) {
    throw new ConfigError(`${where}.vatRate: expected a fraction from 0 to below 1`);
  }
  return { currency: raw.currency, vatRate };
}

export function parseConfig(json: string): Config {
  let data: any;
  try {
    data = JSON.parse(json);
  } catch (error) {
    throw new ConfigError(`not JSON: ${(error as Error).message}`);
  }
  if (typeof data?.countries !== 'object' || data.countries === null) throw new ConfigError('countries: expected an object');
  const countries: Record<string, Country> = {};
  for (const [code, raw] of Object.entries(data.countries)) countries[code] = country(raw, `countries.${code}`);
  return { countries };
}

export function readConfig(path: string = configPath()): Config {
  try {
    return parseConfig(readFileSync(path, 'utf8'));
  } catch (error) {
    if (error instanceof ConfigError) throw new ConfigError(`${path}: ${error.message}`);
    throw error;
  }
}
