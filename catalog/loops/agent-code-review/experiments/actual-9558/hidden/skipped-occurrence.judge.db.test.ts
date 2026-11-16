// The judge's tests of the actual-9558 experiment, copied into packages/loot-core/src/server/budget/ after the
// session and run with the project's own vitest. A yearly $100 bill due Nov 11, 2026; budgeting November. "Nothing
// due" is $7.70: next year's bill saved over the 13 months up to it. The setup is the fixing version's.
import * as db from '#server/db';
import { loadMappings } from '#server/db/mappings';
import { createSchedule, setNextDate } from '#server/schedules/app';
import { loadRules } from '#server/transactions/transaction-rules';
import * as monthUtils from '#shared/months';
import type { CategoryEntity } from '#types/models';

import { runScheduleForecast } from './schedule-template';

vi.mock('#shared/months', async () => {
  const actualModule =
    await vi.importActual<typeof monthUtils>('#shared/months');
  return { ...actualModule, currentDay: vi.fn(actualModule.currentDay) };
});

beforeEach(async () => {
  await global.emptyDatabase()();
  await loadMappings();
  await loadRules();
});

afterEach(() => {
  vi.mocked(monthUtils.currentDay).mockReset();
});

const today = (day: string) =>
  vi.mocked(monthUtils.currentDay).mockReturnValue(day);

async function setUpYearlyBill() {
  const account = await db.insertAccount({
    name: 'Checking',
    offbudget: 0,
    closed: 0,
  });
  const group = await db.insertCategoryGroup({ name: 'Bills' });
  const categoryId = await db.insertCategory({
    name: 'Insurance',
    cat_group: group,
  });
  const category = { id: categoryId, name: 'Insurance' } as CategoryEntity;
  const scheduleId = await createSchedule({
    schedule: { name: 'Insurance' },
    conditions: [
      { op: 'is', field: 'account', value: account },
      { op: 'is', field: 'amount', value: -10000 },
      {
        op: 'is',
        field: 'date',
        value: {
          start: '2026-11-11',
          frequency: 'yearly',
          interval: 1,
          patterns: [],
          skipWeekend: false,
          weekendSolveMode: 'after',
          endMode: 'never',
        },
      },
    ],
  });
  const template = {
    type: 'schedule',
    name: 'Insurance',
    scheduleId,
    priority: 0,
    directive: 'template',
  } as const;
  const payByHand = (date: string) =>
    db.insertTransaction({
      account,
      amount: -10000,
      date,
      category: categoryId,
    });
  return { category, template, scheduleId, payByHand };
}

async function november(
  template: Awaited<ReturnType<typeof setUpYearlyBill>>['template'],
  category: CategoryEntity,
) {
  const result = await runScheduleForecast(
    [template],
    '2026-11',
    0,
    0,
    category,
  );
  return result.to_budget;
}

describe('judge: a skipped yearly bill', () => {
  it('skipped before its date: nothing due in its month', async () => {
    today('2026-11-05');
    const { category, template, scheduleId } = await setUpYearlyBill();
    await setNextDate({ id: scheduleId, advance: true });
    expect(await november(template, category)).toBe(770);
  });

  it('skipped before its date, budgeted after its date: still nothing due', async () => {
    today('2026-11-05');
    const { category, template, scheduleId } = await setUpYearlyBill();
    await setNextDate({ id: scheduleId, advance: true });
    today('2026-11-12');
    expect(await november(template, category)).toBe(770);
  });

  it('paid by hand on Oct 31 and skipped, budgeted on its date: nothing due', async () => {
    today('2026-11-11');
    const { category, template, scheduleId, payByHand } =
      await setUpYearlyBill();
    await payByHand('2026-10-31');
    await setNextDate({ id: scheduleId, advance: true });
    expect(await november(template, category)).toBe(770);
  });

  it('paid by hand and skipped in October, budgeted after its date: nothing due', async () => {
    today('2026-10-31');
    const { category, template, scheduleId, payByHand } =
      await setUpYearlyBill();
    await payByHand('2026-10-31');
    await setNextDate({ id: scheduleId, advance: true });
    today('2026-11-12');
    expect(await november(template, category)).toBe(770);
  });
});

// The schedule is made on Nov 5, before the bill's date; the whole $100 is due in November.
describe('judge: a yearly bill that was not skipped', () => {
  it('unpaid, before its date: the bill is due in its month', async () => {
    today('2026-11-05');
    const { category, template } = await setUpYearlyBill();
    expect(await november(template, category)).toBe(10000);
  });

  it('unpaid, after its date: the bill is still due in its month', async () => {
    today('2026-11-05');
    const { category, template } = await setUpYearlyBill();
    today('2026-11-12');
    expect(await november(template, category)).toBe(10000);
  });
});
