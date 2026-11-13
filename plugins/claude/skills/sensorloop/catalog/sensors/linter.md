---
title: Linter
type: computational
summary: Checks code against rules, and names each violation with its place and how to fix it.
signal: file:line, the rule's name and a message that says how to fix it; a non-zero exit code.
---

A linter checks code against rules and names each violation with its place. It covers the formatter's check too.
Loops can read it on every edit, because it is fast and its messages can tell the agent what to change.

## What it sees

Whatever its rules were written to see, and nothing else. Rules can encode more than style: the project's
conventions, the boundaries between parts of its architecture, and database migrations that are unsafe to run. A
clean run says the code breaks none of the rules. It says nothing about whether the code works.

## Reading the signal

- **Exit code zero**: no rule was broken.
- **Non-zero exit code**: each violation gives its `file:line`, the rule's name and a message. The most useful
  messages teach the fix, so the agent fixes the cause instead of silencing the rule.
- **A disable comment without a reason** is itself a finding. It hides a violation instead of explaining it.

A linter that stops on a broken configuration or a missing plugin has not checked the code. Its failure says nothing
about the work.
