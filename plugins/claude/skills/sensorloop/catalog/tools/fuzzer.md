---
title: Fuzzer
summary: Feeds a function a stream of mutated inputs guided by coverage, and keeps each input that crashes it.
sensors: [input-fault-injection]
layer: project
---

A fuzzer calls one function, the fuzz target, with inputs it keeps mutating, and follows coverage towards new paths.
The fuzzer is tied to the language and the build, so the one in use is found in the project rather than assumed.

## Finding it

- **Fuzz targets in the code**: `func FuzzXxx(f *testing.F)` in Go test files, a `fuzz/` folder made by cargo-fuzz,
  `LLVMFuzzerTestOneInput` in C and C++.
- **The corpus** beside them, in the repository (`testdata/fuzz/` in Go, `fuzz/corpus/` for cargo-fuzz).
- **CI**: a fuzzing job, often a scheduled one, and the time it is given.

## Using it

- **Run one target for a fixed time**: `go test -fuzz=FuzzParse -fuzztime=60s ./parser`, or
  `cargo fuzz run parse -- -max_total_time=60`.
- **Build with sanitizers** (`-fsanitize=fuzzer,address` with Clang), so a memory error crashes instead of passing
  quietly.
- **Short runs on a change, long runs on a schedule**, each starting from the corpus earlier runs left.
- **Replay a crash** from the input file the fuzzer saved: Go replays `testdata/fuzz/` on a plain `go test`.

Examples: libFuzzer (C and C++), `go test -fuzz` (Go), cargo-fuzz (Rust), AFL++, Atheris (Python); with sanitizers
such as AddressSanitizer.
