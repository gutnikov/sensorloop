# Results

- `2026-11-15-pilot`: arm A, 3 runs on `deepseek-flash`, at `max` effort. Not run here: these are the runs of
  shipped-artifact-check's pilot (`catalog/loops/shipped-artifact-check/experiment/results/2026-11-15-pilot`), whose
  task and judge this experiment shares, and `runs.jsonl` is a copy of its. Its lines hold the first verdicts of the
  judge, 0 of 3 runs with I/O in src/report or src/export. After the judge was calibrated on these runs, run 1 makes
  the mistake (`src/report/aging.ts` reads the holiday file through a default argument, `holidays = readHolidays()`),
  so the loop qualifies, 1 of 3 (`hidden/CALIBRATION.md`; the re-judged lines are each run's
  `acceptance.calibrated.jsonl` in that experiment's `runs/pilot`, not committed). The image differs from the
  pilot's by dependency-cruiser in `/opt/depcruise`, which arm B's hooks need; the project's files are the same.
