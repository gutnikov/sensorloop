---
title: Static security scanner
summary: Reads the source for code patterns known to be unsafe, and reports each with its rule and place.
sensors: [security-scanner]
layer: project
---

A static security scanner reads the source without running it and matches it against rules for unsafe patterns:
injection, unsafe deserialisation, weak cryptography. Which scanner and which rules fit depends on the languages, so
they are found in the project rather than assumed.

## Finding it

1. **CI**: a security job, often one that uploads its findings to the code host.
2. **Rule and config files**: a `.semgrep.yml` or a folder of custom rules, a `.semgrepignore`, a CodeQL config.
3. **The dependency manifest**: a scanner for one language among the development dependencies.

When these disagree, CI wins.

## Using it

- **Run it on the changed files** with the project's rules: `semgrep scan --config <rules> <paths>`.
- **Write SARIF** (`--sarif` in Semgrep, `--format=sarif-latest` in CodeQL), so the code host shows findings on the
  diff.
- **Fail only on new findings**: compare with the main branch (`--baseline-commit` in Semgrep).
- **Every suppression carries a reason**, in the comment that makes it (`nosemgrep`) or on the dismissed alert.

Examples: Semgrep, CodeQL, Bandit (Python), gosec (Go).
