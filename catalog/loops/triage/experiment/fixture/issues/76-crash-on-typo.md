---
number: 76
title: "invoicer crashes with a wall of code on a typo in the file"
type: bug
status: open
labels: [ready]
reporter: lee
opened: 2026-11-06
---

A customer typed LOYAL51 instead of LOYAL15 in their invoices file, and `invoicer summary` printed this instead of
telling them what was wrong:

```
file:///opt/invoicer/dist/discounts.js:12
    throw new Error(`unknown discount code: ${code}`);
          ^

Error: unknown discount code: LOYAL51
    at discountRate (file:///opt/invoicer/dist/discounts.js:12:11)
    at totals (file:///opt/invoicer/dist/invoice.js:6:52)
```

Other mistakes in the file get a clear message, such as `invoice INV-7.dueOn: expected a date as YYYY-MM-DD`.
