---
title: Spec completeness
type: computational
summary: Checks a spec that tests are derived from for gaps in the spec itself, before any code or test is written against it.
signal: Each broken trace with its place, each decision-table combination no row covers and each overlap, each test obligation no example pins down, and the open questions.
---

A test writer can test only what the spec states. A gap left in the spec becomes a guess in the test and another in
the code, and the two agree by chance. Loops read this sensor to find those gaps while closing one costs a row in a
table or a question to a person, before anything is built on them.

## What it sees

The spec as text in the repository, in formats a program can read. Its spine is often an event model: the system as a
timeline in which a person on a screen issues a command, the command records events, and the events build what later
screens show. Rules are **decision tables**: the input values on the left, the result on the right, one row per
combination. An **example** is one case: a named state to start from (a fixture, with its concrete values), the
person's inputs, the answers of outside systems, and what the person then sees, or the error.

- **Where every field comes from.** Every field shown on a screen or carried by an event must come from an input, an
  earlier event, a rule or an outside system's answer. A field that comes from nowhere is a hole in the design, and so
  is a name of a state, an input or a field that does not exist.
- **Decision tables.** Every combination of input values has exactly one row.
- **Test obligations**: what an exhaustive set of tests must check. Each command's success and each of its errors,
  each outcome of an outside system, each step that happens on time, each row of a decision table, each field shown on
  a screen. An obligation no example pins down is a test nobody can write without guessing its expected result.

It sees what the spec states, not whether it is what was wanted: a complete spec of the wrong behaviour passes, and
that judgement is a person's. It also warns of what is likely missing: an event that no screen ever shows usually
means nobody decided what the person sees when something fails.

## Reading the signal

- **Complete**: zero errors, no gap in any table, and every test obligation pinned down by an example or held by an
  open question that has been asked.
- **A broken trace**: a field that comes from nowhere, or a name of a state, input or field that does not exist. The
  spec contradicts itself.
- **A gap or an overlap in a table**: a combination of inputs no row covers, or two rows that match the same inputs.
- **An open obligation**: a test obligation no example pins down, named by its kind and its place.
- **An open question**: something the sources do not settle. The questions are asked of a person once, in one batch,
  and a test that depends on one is marked as known to fail rather than guessed.
- **Zero errors with obligations open** is not complete: the spec holds together, but tests cannot yet be derived
  from it.
- **Nothing checked** is not a pass. A check that found no spec files has observed nothing.

A gap is closed with a row, an example or a question, never with an invented value: a value no source gave is a
question for a person. A check that fires on a correct spec, or misses a broken one, is itself wrong; it is fixed, and
the broken copy is kept as its test case.
