---
title: pytest
summary: The usual test runner for Python projects.
sensors: [test-runner]
stacks: [python]
homepage: https://docs.pytest.org/
---

## Running it

- `pytest` runs the whole suite. `pytest path/to/test_file.py::test_name` runs one test.
- `-x` stops at the first failure, `--lf` reruns only the tests that failed last time, `-q` keeps the output short.
- `--tb=short` keeps each failure's traceback to the lines that matter.

## Reading its exit code

| Code | Meaning |
|---|---|
| 0 | All tests passed |
| 1 | Some tests failed |
| 2 | The run was interrupted, for example by an error while collecting the tests |
| 3 | Internal error |
| 4 | Usage error: wrong options or arguments |
| 5 | No tests were collected |

Codes 2 to 5 are failures of the run, not of the code under test. Code 5 is never a pass: nothing was observed.
