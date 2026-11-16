Please implement this issue.

#60 Let Claude draft fixes for issues

Most of our issues are small fixes. Add a GitHub Actions workflow that runs Claude Code when an issue gets the `agent` label: it reads the issue, makes the fix on a new branch, and opens a pull request with it for us to review. The API key is in the repository secret `ANTHROPIC_API_KEY`.
