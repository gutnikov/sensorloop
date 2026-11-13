---
title: Lint with fix instructions
summary: Every lint violation reaches the agent with a text that says how to fix it, so it fixes the cause instead of silencing the rule.
sensors: [linter]
placement: inner
when: At each commit, and again in CI as the final run.
failure: Any lint error, and any suppression comment that does not give its reason.
next: The agent follows the instruction and fixes the code, or suppresses the violation with a comment that says why. Raising a limit or loosening the rules is a change a person approves, not a fix.
---

## The loop

1. The linter runs when the agent commits.
2. Each violation is printed with its fix: `file:line: rule: message. How to fix: instruction`.
3. The agent follows the instruction, or suppresses the violation with its reason on the same line.
4. CI runs the same linter as the final check.

## Why

A message that says only what is wrong lets the agent make it go away the easy way: raise a threshold, disable the
rule. A message that says how to fix the violation puts the right fix in front of the agent at the moment it needs
it.

## Set up

- **An instruction in every message.** Either a formatter that looks up each rule's instruction in a table and prints
  it after the message, or custom rules whose messages carry the fix.
- **The instruction says what to do, and when an exception is fair.** For complexity: extract the branches into named
  functions, and raise the limit only where refactoring is not possible, saying why.
- **Size and complexity rules on**: parameters per function, lines per function and per file, complexity. Default
  presets often leave them off; the project picks the limits.
- **A banned call is a line of configuration, and its reason is the fix.** Linters can forbid an import or a call with
  a message of their own; write the message as the instruction ("create database pools through the shared helper").
- **Every suppression carries its reason**, such as `// eslint-disable-next-line <rule> -- <reason>` in ESLint. The
  check fails on one without, so suppressions stay visible and reviewable.
- **Out of the agent's reach.** CI runs the final check, and the linter's configuration and formatter are protected:
  a limit the agent raises is a change a person approves.
