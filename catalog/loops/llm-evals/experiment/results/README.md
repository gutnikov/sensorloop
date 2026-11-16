# Results

- `2026-11-15-pilot`: arm A, 3 runs on `deepseek-flash`, at `max` effort. First judged 0 of 3; after calibrating the
  judge on these runs, 1 of 3. Run 2 made the feature cheaper (thinking off, invoices sent in one batch message) and
  its evals said 100% twice, but they ran the old one-invoice message the CLI no longer sends. The judge's eval of
  what the CLI sends: base 100%, 100%, 100%; the agent's 95%, 95%, 95% (the case `e-learning` fails in every run of
  it). The first judge let a drop of exactly one case pass; the card counts any drop beyond the base's spread, here 0
  (`hidden/CALIBRATION.md`, `acceptance.calibrated.jsonl`).
