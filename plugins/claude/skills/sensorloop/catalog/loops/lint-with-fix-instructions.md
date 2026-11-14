---
title: Lint with fix instructions
summary: Every lint violation reaches the agent with a text that says how to fix it, so the agent fixes the cause instead of silencing the rule.
sensors: [linter]
when: At each commit, and again in CI as the final run.
failure: A violation of any rule set to fail the run, and any suppression that does not give its reason.
next: The agent follows the instruction and fixes the code, or suppresses the violation with a comment that says why. When the same violation is still there after three rounds, it stops and shows a person the violation and its instruction. Raising a limit or loosening the rules is not a fix; the agent stops and proposes the change to a person.
---

## The loop

1. The linter runs when the agent commits.
2. Each violation is printed with its instruction: `file:line: rule: message. How to fix: instruction`.
3. The agent follows the instruction, or suppresses the violation with a comment that gives the reason, and commits
   again.
4. CI runs the same linter as the final check.

## Why

A message that says only what is wrong lets the agent make it go away the easy way: raise a threshold, disable the
rule. A message that says how to fix the violation puts the right fix in front of the agent at the moment of the
violation.

## Set up

- **An instruction in every message.** Either a formatter that looks up each rule's instruction in a table and prints
  it after the message, or custom rules whose messages end with the instruction.
- **The instruction says what to do, and when an exception is fair.** For complexity: extract the branches into named
  functions; where refactoring is not possible, propose a higher limit to a person, saying why.
- **Size and complexity rules turned on**: parameters per function, lines per function and per file, complexity.
  Default presets often leave them off; the project picks the limits.
- **A banned call is a line of configuration.** Linters can forbid an import or a call with a message of their own;
  write that message as the instruction ("create database pools through the shared helper").
- **Every suppression carries its reason**, in the linter's own syntax: `// eslint-disable-next-line <rule> -- <reason>`
  in ESLint, `//nolint:<linter> // <reason>` in golangci-lint, `#[allow(<lint>, reason = "<reason>")]` in Rust. The
  check fails on one without; where the linter cannot report it, a search over the changed files does. A person who
  reviews the change sees every suppression with its reason.
- **Out of the agent's reach.** CI runs the final check, and the linter's configuration and formatter are protected:
  a higher limit goes in only through a change a person approves.
