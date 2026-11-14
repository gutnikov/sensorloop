---
title: Spec completeness
type: computational
summary: Checks the spec for gaps a test writer would have to guess at, before any test or code is written from it.
signal: "The findings, each with its place in the spec: broken traces (a field with no source, or a name that does not exist), gaps and overlaps in decision tables (input combinations with no row, or with two), and test obligations (cases the tests must cover) with neither an example nor an open question. Also the open questions, and warnings of what is likely missing."
---

A test writer can test only what the spec states. A gap left in the spec becomes a guess in the test and another in
the code, and the two agree by chance. Loops read this sensor to find those gaps before anything is built on them:
then closing one costs only a row in a table or a question to a person.

## What it sees

The spec as text in the repository, in a structured format a program can check (YAML or JSON files, or a standard
format such as DMN for decision tables), with its open questions recorded in it. Its spine is often an event model:
the system as a timeline in which a person on a screen issues a command, the command records events, and the events
build what later screens show. Rules are **decision tables**: the input values on the left, the result on the right,
one row per combination. An **example** is one case: a **named state** to start from (concrete data, which a test
loads as its fixture), the person's inputs, the answers of outside systems, and what the person then sees, or the
error.

- **Where each field comes from.** Every field shown on a screen or carried by an event must come from an input, an
  earlier event, a rule or an outside system's answer. A field with no source is a **broken trace**, a hole in the
  design: a receipt that shows a discount no input, event or rule provides. So is a name of a state, an input or a
  field that does not exist.
- **Decision tables.** Every combination of input values has exactly one row.
- **Test obligations.** A test obligation is a case an exhaustive set of tests must cover: each command's success and
  each of its errors, each outcome of an outside system, each step triggered by time (a timer, a schedule, a
  deadline), each row of a decision table, each field shown on a screen. An obligation no example pins down is a test
  nobody can write without guessing its expected result.

It sees what the spec states, not whether it is what was wanted: a complete spec of the wrong behaviour passes, and
that judgement is a person's.

## Reading the signal

- **Complete**: no broken trace, no gap or overlap in any table, and every test obligation pinned down by an example
  or held by an open question.
- **A broken trace**: a field with no source, or a name of a state, input or field that does not exist. The spec
  contradicts itself.
- **A gap or an overlap in a table**: a combination of inputs no row covers, or two rows that match the same inputs.
- **An open obligation**: a test obligation with neither an example nor an open question, named by its kind and its
  place. Even with no other finding, the spec is not complete: it holds together, but tests cannot yet be derived
  from it.
- **An open question**: a value the requirements do not settle, recorded in the spec where it is needed. The signal
  lists the questions so that a loop can ask a person all of them at once. Until one is answered, the test writer
  marks a test that depends on it as known to fail rather than guessing its result.
- **A warning**: something likely missing rather than wrong. An event that no screen ever shows usually means nobody
  decided what the person sees when something fails. A warning does not count against Complete; it shows where to
  look.
- **Nothing checked** is not a pass. A check that found no spec files has observed nothing.

A gap is closed with a row, an example or a question, never with an invented value: a value the requirements do not
give is a question for a person. A check that fires on a correct spec, or misses a broken one, is itself wrong: fix
the check, and keep the spec it misjudged as a test case for it.
