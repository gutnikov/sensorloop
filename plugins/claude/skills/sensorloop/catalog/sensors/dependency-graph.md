---
title: Dependency graph
type: computational
summary: Measures the graph of imports between modules (cycles, fan-in, fan-out) and compares it with an approved baseline.
signal: A new cycle with its path, or a module whose coupling grew past the baseline.
---

The dependency graph is the graph of imports between the project's modules. This sensor measures it (cycles, fan-in,
fan-out) and compares it with an approved baseline. Loops read it because structure erodes one import at a time, and
no single change looks like the cause.

## What it sees

Which modules import which, and how coupled each module is. Unlike a lint rule, which judges one import, it tracks a
trend across the whole graph. It sees structure, not behaviour, and only the imports the code declares: a module
loaded by name at run time does not appear in it.

## Reading the signal

- **No worse than the baseline**: no new cycle, and no module's coupling grew past its recorded value.
- **A new cycle**: the signal gives its path, module by module.
- **Coupling past the baseline**: the module, and the measure that grew.

The baseline may only shrink: when the graph improves, the new values become the baseline. The graph changes slowly,
so the sensor fits a scheduled run as well as a pull request.
