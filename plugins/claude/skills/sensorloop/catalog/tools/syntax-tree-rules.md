---
title: Syntax-tree pattern rules
summary: Rules written as code patterns over the syntax tree, for conventions no stock linter knows.
sensors: [linter, security-scanner]
layer: project
---

Some conventions belong to one project, and no stock linter knows them. This tool writes them as code patterns matched
against the syntax tree, so a rule sees the structure of the code rather than its text, in any language the tool can
parse.

## Finding it

Look for the rule files in the repository (an `sgconfig.yml` and its rule directories for ast-grep, a directory of
YAML rules for Semgrep) and in CI or the pre-commit config for the step that runs them.

## Using it

- **Run them**: `ast-grep scan`, or `semgrep scan --config <rules>`; on changed files while working, on everything in
  CI.
- **Test every rule**: each rule is kept with examples that must match and examples that must not, run as tests of the
  rule (`ast-grep test`, `semgrep --test`).
- **Say how to fix**: the rule's message names the fix, not only the problem.

Examples: ast-grep, Semgrep custom rules.
