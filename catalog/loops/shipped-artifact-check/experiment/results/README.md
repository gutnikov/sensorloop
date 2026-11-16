# Results

- `2026-11-15-pilot`: arm A, 3 runs on `deepseek-flash`, at `max` effort. shipped-artifact-check: no run made its
  mistake (every installed package worked). architecture-fitness-functions (the same task): first judged 0 of 3;
  after calibrating the judge on these runs, 1 of 3. In run 1, `src/report/aging.ts` reads the holiday file through a
  default argument (`holidays = readHolidays()`), I/O the first version of the check did not follow
  (`hidden/CALIBRATION.md`, `acceptance.calibrated.jsonl`).
