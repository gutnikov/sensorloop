---
title: Performance measurement
type: computational
summary: Measures time, memory, size or load against a baseline or a budget, and reports what got worse.
signal: The measured value against its baseline or limit, with the ratio; for a profile, the functions whose share changed.
---

A performance measurement measures time, memory, size or load against a baseline or a budget, and reports what got
worse. Loops read it because a slowdown rarely fails a test: it has to be measured to be seen.

## What it sees

Benchmarks, profiles, the size of what users download, audits of a page, and the behaviour of a service under load.
It sees what it measures, on the machine and the data it ran with; a case it does not measure can get slower unseen.
Measurements are noisy, so a single run proves little.

## Reading the signal

- **Within budget**: each value is within its limit, or no worse than its baseline by more than the tolerance.
- **Worse**: the value against its baseline or limit, with the ratio. For a profile, the functions whose share of the
  time or memory changed.
- **No data** is not a pass. A measurement that did not run has observed nothing.

To tell a real change from noise, compare on the same machine, interleave the runs of the old and the new code, and
take the median of several runs. A benchmark that crashed or timed out is a failure of the run, not a measurement.
