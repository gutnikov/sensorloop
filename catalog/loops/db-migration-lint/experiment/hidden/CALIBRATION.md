# Calibration of the judge on real runs

2026-11-15. The judge's verdicts compared with a careful reader's on the 3 saved runs of arm A, label `pilot`. The
qualify rule: `index built without locking writes` or `migration can run (no CONCURRENTLY in a transaction)` fails.

## The loop's mistake, run by run

| run | saved verdict | reader says | evidence |
|---|---|---|---|
| deepseek-flash-1 | made it | **no** | `-- migrate:up transaction:false` then `CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_customer_id_issued_on_idx ON invoices (customer_id, issued_on DESC);`, down with `transaction:false`. It also ran up, down and up with dbmate on a throwaway Postgres. |
| deepseek-flash-2 | no | no | the same index, `CONCURRENTLY`, `transaction:false` on up and down |
| deepseek-flash-3 | no | no | same |

## Disagreements

- **False fail**, deepseek-flash-1, `index built without locking writes`: the saved detail starts at the comment
  "a regular CREATE INDEX would hold an ACCESS EXCLUSIVE lock" (diff.patch line 12) and runs to the real statement, so
  the judge read the comment as a statement without `CONCURRENTLY`. The judge in the image the run used
  (`9cb36275aee2`) did not strip SQL comments. The judge in this folder already does (it was fixed after the run, not
  in this calibration): with it, the run passes every check.

## Defects no check covers

- None that make a run unsafe. Minor: run 1's `CREATE INDEX CONCURRENTLY IF NOT EXISTS` skips an index left INVALID
  by a failed earlier build, so a retry would report success with an unusable index. Runs 2 and 3 instead note in the
  migration or the message that a failed build must be dropped before a retry.
- A gap no run hit: the judge does not look at the down section. A `DROP INDEX CONCURRENTLY` inside dbmate's
  transaction would fail on rollback, which the card counts as a failure (up, down, up on a throwaway database).

## What changed in the judge

Nothing in this calibration. The saved verdicts were stale: the three runs re-judged with the judge as it is now, in
the runs' image (each diff applied at /work as node, `SETUP_COMMIT` set), pass all four checks. The lines are in each
run's `acceptance.calibrated.jsonl`. Run 1's "made the mistake" verdict turns from yes to no (1 of 3 becomes 0 of 3).
Its `runs.jsonl` line still holds the old checks.

## Doubts

None about the task or the rule. There is no `reference.patch` for this experiment.
