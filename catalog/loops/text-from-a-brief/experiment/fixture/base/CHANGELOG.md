# Changelog

What changed in each release of invoicer, for the people who use it.

## 0.4.0 (2026-09-01)

- New: `invoicer csv` writes one row per invoice, for spreadsheets.
- New: the aging report takes `--today`, to see it as of another day.
- Fixed: a discount is taken off before tax, as on the printed invoice. The totals of discounted invoices were too high
  by the tax on the discount.

## 0.3.0 (2026-07-14)

- New: `invoicer aging` lists the overdue invoices by how long they are overdue: 1-30, 31-60, 61-90 and over 90 days.
- Changed: amounts print with thousands separators and two decimals, as $1,234.50.
