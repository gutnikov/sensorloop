---
type: llm
focus: trace
---

The interview starts by finding the catalog's tools that the project already has, and showing them to the person before (or together with) the first question.

PASS if all of these hold:
- Before its first question, or in the same message just above it, the agent showed the tools it found in the project, each with where it found it: at least the project's test command (`npm test`, which runs `node --test`, from `package.json` and the CI workflow) and the CI system (GitHub Actions, from `.github/workflows/test.yml`).
- It listed only what the repository shows. It did not claim a linter, a formatter, a type checker, an error tracker, a log store or metrics, which this project does not have. Saying that such tools would live outside the repository, and that the person can name any they use, is fine.
- Showing the tools did not cost a turn on its own: the first questions came in the same message, or the agent did not stop to wait for a reply to the table alone.
FAIL if it asked its first question without showing the tools it found, listed tools the project does not have as found, or stopped after the table to wait for the person before asking anything.
