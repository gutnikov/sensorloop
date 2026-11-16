---
number: 66
title: "Unknown discount code: a stack trace instead of an error"
type: bug
status: open
labels: [in-progress]
assignee: sam
reporter: sam
opened: 2026-10-27
---

`discountRate` throws a plain `Error` for a code it does not know, and `cli.ts` only catches `InvoiceFileError`, so
every command prints a stack trace. It should be an error like the other problems in the file, naming the invoice and
the code (`invoice INV-7.discountCode: unknown code FREE100`), with exit status 1.

## Comments

- sam, 2026-10-29: On it, branch `sam/66-discount-codes`. I'm checking the codes in `parseInvoice`, so a bad code is
  found when the file is read.
