// The judge's tests of the actual-9225 experiment, copied into packages/loot-core/src/shared/ after the session and run
// with the project's own vitest. Occurrences come from getNextDateAfter, the function the app already used to step
// through a schedule's dates at the base commit. The issue accepts either answer for a month without the day ("30/6 or
// 1/7 ... as long as it gets scheduled somewhere"), so these tests accept both: the last day of the short month, or the
// first day of the next. Each `it` is one check of the judge.
import { getNextDateAfter } from './schedules';

type Pattern = { value: number; type: 'day' };

function monthly(start: string, patterns: Pattern[] = [], extra: Record<string, unknown> = {}) {
  return { op: 'isapprox', value: { start, frequency: 'monthly', patterns, ...extra } };
}

function occurrences(dateCond: ReturnType<typeof monthly>, afterDate: string, until: string, max = 40) {
  const dates: string[] = [];
  let cursor = afterDate;
  for (let i = 0; i < max; i++) {
    const next = getNextDateAfter(dateCond, cursor);
    if (next == null || next > until) break;
    dates.push(next);
    cursor = next;
  }
  return dates;
}

const lastDay = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
};
const nextFirst = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${m === 12 ? y + 1 : y}-${String((m % 12) + 1).padStart(2, '0')}-01`;
};
// The month's own date when it has the day, else its last day or the next month's first.
const slotOk = (ym: string, day: number, date: string) =>
  date === `${ym}-${String(day).padStart(2, '0')}` || date === lastDay(ym) || date === nextFirst(ym);

function everyMonth(dateCond: ReturnType<typeof monthly>, day: number, months: string[]) {
  const start = dateCond.value.start;
  const dayBefore = new Date(Date.parse(`${start}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  const dates = occurrences(dateCond, dayBefore, nextFirst(months[months.length - 1]));
  expect(new Set(dates).size, `duplicates in ${dates}`).toBe(dates.length);
  for (const ym of months) {
    expect(
      dates.some(date => slotOk(ym, day, date)),
      `no occurrence for ${ym} in ${dates.join(', ')}`,
    ).toBe(true);
  }
  expect(dates.length, dates.join(', ')).toBe(months.length);
}

const MONTHS = [
  '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10',
  '2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04',
];

describe('judge: the issue', () => {
  it('monthly from May 31: every month gets an occurrence', () => {
    everyMonth(monthly('2026-05-31'), 31, MONTHS);
  });

  it('monthly on day 31: every month gets an occurrence', () => {
    everyMonth(monthly('2026-05-31', [{ value: 31, type: 'day' }]), 31, MONTHS);
  });

  it('monthly on day 30: every month gets an occurrence', () => {
    everyMonth(monthly('2026-05-30', [{ value: 30, type: 'day' }]), 30, MONTHS);
  });

  it('monthly on day 15: unchanged', () => {
    const dates = occurrences(monthly('2026-05-15', [{ value: 15, type: 'day' }]), '2026-05-14', '2026-09-30');
    expect(dates).toEqual(['2026-05-15', '2026-06-15', '2026-07-15', '2026-08-15', '2026-09-15']);
  });
});

describe('judge: the review', () => {
  // CodeRabbit on d6c35ec8: every 10 months from Apr 30, 2026, the grid reaches February 2027.
  it('every 10 months on day 30 from Apr 30, 2026: February 2027 gets its occurrence', () => {
    const dates = occurrences(monthly('2026-04-30', [{ value: 30, type: 'day' }], { interval: 10 }), '2026-04-29', '2028-12-31');
    expect(new Set(dates).size, `duplicates in ${dates}`).toBe(dates.length);
    expect(dates[0]).toBe('2026-04-30');
    expect(['2027-02-28', '2027-03-01'], dates.join(', ')).toContain(dates[1]);
    expect(dates[2], dates.join(', ')).toBe('2027-12-30');
  });

  // And: a leap day the grid reaches comes once, not twice.
  it('every 10 months on day 29 from Apr 29, 2027: Feb 29, 2028 comes once', () => {
    const dates = occurrences(monthly('2027-04-29', [{ value: 29, type: 'day' }], { interval: 10 }), '2027-04-28', '2029-12-31');
    expect(dates[0]).toBe('2027-04-29');
    expect(dates[1]).toBe('2028-02-29');
    expect(dates.filter(d => d === '2028-02-29')).toHaveLength(1);
    expect(dates[2], dates.join(', ')).toBe('2028-12-29');
  });
});
