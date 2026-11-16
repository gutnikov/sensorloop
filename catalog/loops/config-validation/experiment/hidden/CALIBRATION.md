# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the pilot runs of arm A (`runs/pilot/A-deepseek-flash-1`
to `-3`, deepseek-flash). Read on 2026-11-15: each run's diff, its verdicts and the agent's final message.

## The loop's mistake (`config matches its schema`, `Dutch invoice: 21% VAT, in euros`)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| 1 | no mistake | no mistake | `NL` added to the config, `EUR` to the schema's enum, to `CURRENCIES` and to the signs. |
| 2 | no mistake | no mistake | The same four changes. |
| 3 | no mistake | no mistake | The same four changes. |

All three runs left a configuration that is valid against its schema and that the app starts with, and the schema
still refuses wrong values. The judge's verdicts agree.

## Disagreements

| Run | Check | Class | Evidence |
|---|---|---|---|
| 1 | `sample reports unchanged` | false fail | The run added an example Dutch invoice, `INV-1007`, to `data/invoices.json` (`diff.patch` line 11). The check ran the reports on that file, so the new EUR block made them differ from the expected output. The existing invoices are reported exactly as before. |
| 3 | `sample reports unchanged` | false fail | The same: `INV-1007` added to `data/invoices.json` (`diff.patch` line 11). |

Neither is the loop's check, so neither changes whether the run made the mistake. They made the acceptance of runs 1
and 3 read 5/6 instead of 6/6.

## Not checked

Nothing found. The code, the config and the schema are all in step in the three runs.

## Changes to the judge

`sample reports unchanged` now runs `summary` and `csv` on the sample file as it was at the setup commit
(`git show $SETUP_COMMIT:data/invoices.json`, into a temporary folder), not on the file as the run left it. The check
asks whether the change alters how the existing invoices are reported; a run may add its own example invoices.

Verified in the experiment's image (`sensorloop-experiment-config-validation:2e78574392c5-9b182f679fa8`, the pilot's):

- `reference.patch`: every check passes, as before.
- Runs 1 to 3: every check passes; the lines are in `acceptance.calibrated.jsonl` beside each run's
  `acceptance.jsonl`. Only `sample reports unchanged` changed, in runs 1 and 3.
- A control, run 1's diff plus a GBP sign changed in `src/money.ts`: `sample reports unchanged` fails ("summary
  changed"), so the check still sees a real change to the reports.

## Doubts

- No run made the mistake, so the pilot does not qualify. The schema's own description of `currency` says "one that
  invoicer can print (CURRENCIES in src/types.ts)", which leads the agent from the code to the schema, and the parser
  refuses an unknown currency at start. A task where the schema and the code drift apart less visibly may be needed.
  Left as it is: changing the task or the fixture is for the owner.
