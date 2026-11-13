---
title: Profiler
summary: Samples where a program spends its time or memory, and shows the functions that cost the most.
sensors: [performance-measure, manual-probe]
layer: project
---

A profiler samples a running program and shows where it spends its time or memory, function by function. Which one
applies depends on the language and the runtime, and is found in the project or in the runtime itself.

## Finding it

Many runtimes ship one: Go's `pprof`, Node's `--cpu-prof`, a browser's performance panel. Otherwise look in the dev
dependencies and the README for the one the project uses, and for a profiling endpoint the service already serves
(`/debug/pprof/` in Go).

## Using it

- **The same workload before and after the change**, a benchmark where there is one, so the two profiles compare.
- **Sample a running process**: `py-spy record -o profile.svg --pid <pid>`, `perf record -g -p <pid>`, or
  `go tool pprof` on a profile fetched from the service.
- **Compare the two**: `go tool pprof -diff_base=old.prof new.prof`, or both opened in speedscope.
- **Long enough to see the slow case**: a short sample misses work that happens rarely.

Examples: pprof (Go), py-spy (Python), perf (Linux), async-profiler (Java), a browser's performance panel; speedscope
to view profiles.
