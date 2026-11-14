---
title: The project's benchmark harness
summary: Whatever runs this project's benchmarks and keeps their results to compare against.
sensors: [performance-measure]
layer: project
---

The benchmark harness runs the project's benchmarks and keeps their results, so a change can be measured against what
came before. Which harness that is depends on the language: look for it in the project, and do not assume one.

## Finding it

- **Benchmark code**: a `benches/` directory in Rust, `Benchmark` functions in Go test files, a JMH source set in
  Java.
- **A `bench` target** in the task file.
- **A CI job** that runs the benchmarks and stores their results. Saved baselines live with that job: in a separate
  branch, or in a store such as the CI system's artifacts or a storage bucket.

When there is none, ask a person before adding one.

## Using it

- **Run it as found**: `cargo bench`, `go test -run='^$' -bench=.`, `pytest --benchmark-only`.
- **Measure on one machine**: a dedicated machine, or the old and the new code run in turns on the same one, so its
  noise falls on both.
- **Compare several runs with a saved baseline**: `go test -count=10` compared with `benchstat`; `--benchmark-save`
  and `--benchmark-compare` in pytest-benchmark; `--save-baseline` and `--baseline` in criterion.

Examples: pytest-benchmark (Python), criterion (Rust), `go test -bench` (Go), JMH (Java), BenchmarkDotNet (.NET).
