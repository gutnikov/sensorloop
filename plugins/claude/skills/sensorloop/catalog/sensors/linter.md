---
title: Linter
type: computational
summary: Checks code or prose against rules, and names each violation with its place and the rule it breaks.
signal: file:line, the rule's name and a message, which at best says how to fix it; a non-zero exit code.
---

The formatter's check counts as a linter too, and so does a prose linter run on the project's documents. Loops can
read a linter on every edit when it is fast on the changed files, and its messages can tell the agent what to change.

## What it sees

Whatever its rules were written to see, and nothing else. Rules can encode more than style: the project's
conventions, the boundaries between parts of its architecture, and which database migrations are unsafe to run. A
clean run says the code or the text breaks none of the rules. It says nothing about whether the code works or the
text reads well.

## Reading the signal

- **Exit code zero**: no rule set to fail the run was broken. In many linters, warnings still end with zero, and so
  does a run that matched no files: check that the changed files were checked.
- **Non-zero exit code**: each violation gives its `file:line`, the rule's name and a message. The most useful
  messages teach the fix, so the agent fixes the cause instead of silencing the rule.

A disable comment without a reason hides a violation instead of explaining it. Some linters can report such comments
as violations; where the linter cannot, the loop or the reviewer looks for them.

A linter that stops on a broken configuration or a missing plugin has not checked the code. It also ends with a
non-zero exit code: its output names the configuration error instead of listing violations by `file:line`. Its
failure says nothing about the work.
