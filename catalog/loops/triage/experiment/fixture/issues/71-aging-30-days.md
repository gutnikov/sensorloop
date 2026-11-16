---
number: 71
title: "aging: an invoice 30 days overdue is put in 31-60 days"
type: bug
status: open
labels: [ready]
reporter: marta
opened: 2026-11-03
---

An invoice that is 30 days overdue shows under 31-60 days; it belongs in 1-30. The same at 60 and 90 days.

To see it: `npm run dev -- aging data/invoices.json --today 2026-10-31`. INV-1002 was due on 1 October, so it is 30
days overdue, and it is counted under 31-60 days.
