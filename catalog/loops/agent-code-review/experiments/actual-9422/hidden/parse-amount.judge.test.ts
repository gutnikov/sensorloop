// The judge's tests of the actual-9422 experiment, copied into packages/loot-core/src/shared/ after the session and
// run with the project's own vitest. Each `it` is one check of the judge.
import { amountToInteger, looselyParseAmount } from './util';

const ISSUE_CSV_AMOUNTS = [
  '-18.818689242668',
  '-12039.958653084400',
  '-1.26313799999993E-06',
  '-9.953776817384400',
  '-0.096469531158',
  '-3.625916129836',
  '-4185.895812000000',
  '-1.1148430000001800',
  '-1.69622000000036E-04',
];

describe('judge: the issue', () => {
  it('scientific notation from the issue', () => {
    expect(looselyParseAmount('-1.26313799999993E-06')).toBeCloseTo(
      -1.26313799999993e-6,
      15,
    );
    expect(looselyParseAmount('-1.69622000000036E-04')).toBeCloseTo(
      -1.69622000000036e-4,
      15,
    );
    expect(looselyParseAmount('(1.26E-06)')).toBeCloseTo(-1.26e-6, 15);
  });

  it('more than nine decimal places', () => {
    expect(looselyParseAmount('-12039.958653084400')).toBeCloseTo(
      -12039.9586530844,
      8,
    );
    expect(looselyParseAmount('-1.1148430000001800')).toBeCloseTo(
      -1.11484300000018,
      12,
    );
  });

  it('every amount of the issue CSV parses, and their total is safe', () => {
    let total = 0;
    let expected = 0;
    for (const text of ISSUE_CSV_AMOUNTS) {
      const value = looselyParseAmount(text);
      expect(value, text).not.toBeNull();
      expect(value as number, text).toBeCloseTo(parseFloat(text), 8);
      total += amountToInteger(value as number);
      expected += amountToInteger(parseFloat(text));
    }
    expect(Number.isSafeInteger(total)).toBe(true);
    expect(total).toBe(expected);
  });
});

describe('judge: the review', () => {
  // CodeRabbit on the first version: the mantissa must be parsed as an amount is, then scaled.
  it('a comma decimal in the mantissa', () => {
    expect(looselyParseAmount('1,23e2')).toBeCloseTo(123, 10);
  });

  it('a currency sign before the mantissa', () => {
    expect(looselyParseAmount('$1.23e2')).toBeCloseTo(123, 10);
  });

  // CodeRabbit on the second version.
  it('three digits after the separator in the mantissa', () => {
    expect(looselyParseAmount('1.234e2')).toBeCloseTo(123.4, 10);
  });

  it('a small mantissa with a positive exponent', () => {
    expect(looselyParseAmount('0.0000001e8')).toBeCloseTo(10, 10);
  });

  it('a large mantissa with a negative exponent', () => {
    expect(looselyParseAmount('1000000000000000e-14')).toBeCloseTo(10, 10);
  });
});
