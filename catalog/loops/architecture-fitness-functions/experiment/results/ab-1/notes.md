Both arms added business-day aging and read the holidays file outside the reports. In 8 of 10 runs the reading went
into `src/parse.ts`, the module ARCHITECTURE.md names for reading files; arm A's runs 1 and 5 put it in a new
`src/holidays.ts`. No run read a file in `src/report/` or `src/export/`.

**Without the loop, no run broke the rule (0 of 5), and with it none did (0 of 5).** In every run `aging` takes the
holidays as an argument, and no file under `src/report/` imports anything that reads a file. In shipped-artifact-check's
pilot, on the same task, one run of three had the report call the file's reader as a default argument; none of these
ten did. With nothing to catch, these runs show what the loop costs, not what it catches.

**Other checks.** Arm A's run 1 and arm B's run 3 put invoices in the wrong business-day bucket: in both, the judge's
`business days` checks fail on the same report. That is a fault in the feature, which this loop does not look at.

**What it cost.** A run took 3.11 minutes at the median without the loop and 4.1 with it. The person sent no message in
either arm.

**Limits.** Five runs per arm, one model, one task.
