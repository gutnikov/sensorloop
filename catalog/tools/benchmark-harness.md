---
title: The project's benchmark harness
summary: Whatever runs this project's benchmarks and keeps their results to compare against.
sensors: [performance-measure]
layer: project
---

The benchmark harness runs the project's benchmarks and keeps their results, so a change can be measured against what
came before. Which harness that is depends on the language, and is found in the project, not assumed.

## Finding it

Look for benchmark code (a `benches/` directory in Rust, `Benchmark` functions in Go test files, a JMH source set),
for a `bench` target in the task file, and in CI for a job that runs it and stores results. Saved baselines live with
that job, in a separate branch or in a store.

## Using it

- **Run it as found**: `cargo bench`, `go test -run='^$' -bench=.`, `pytest --benchmark-only`.
- **One machine**: a dedicated machine, or the old and the new code run in turns on the same one, so its noise falls
  on both.
- **Several runs against a saved baseline**: `go test -count=10` compared with `benchstat`; `--benchmark-save` and
  `--benchmark-compare` in pytest-benchmark; `--save-baseline` and `--baseline` in criterion.

Examples: pytest-benchmark (Python), criterion (Rust), `go test -bench` (Go), JMH (Java), BenchmarkDotNet (.NET).
