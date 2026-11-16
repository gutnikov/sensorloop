# Contributing to invoicer

A person reviews every pull request against the list below before it is merged. Check your change against it before
you ask for a review: a point left open sends the pull request back.

1. **Options are documented.** Every option a command takes is in two places: the usage text in `src/cli.ts`, which
   `invoicer --help` prints, and the Options table of the README.
2. **The changelog says what changed.** Every change a user can see has a line in `CHANGELOG.md` under
   `## Unreleased`, ending with the issue's number: `- aging takes --today to set the report's date (#28)`.
3. **New behaviour has a test.** Each new behaviour has a test in `tests/` that fails without the change.
4. **Option values are checked.** A command checks each option's value before it uses it. A wrong or missing value is
   an error that names the option and what it got, and exits with status 2:
   `invoicer: --today: expected a date as YYYY-MM-DD, got 2026-1-5`. Status 1 is for a bad invoices file.
5. **Reports stay as they are.** A new option changes nothing when it is not given: without it, the output is byte for
   byte what it was.

CI runs `npm run typecheck`, `npm test` and `npm run build`; a pull request is reviewed once they pass.
