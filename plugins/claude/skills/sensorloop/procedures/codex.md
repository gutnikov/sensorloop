# Running Sensorloop in Codex

Use the shared interview, registry, catalog, procedures and reporting format. Apply these
runtime-specific choices wherever the recipes describe Claude Code.

- **Project instructions.** Merge a sentence into the project's `AGENTS.md` asking Codex to
  read `.sensorloop/LOOPS.md` before working in the repository. Preserve existing instructions.
  Check this reference when the registry changes. Claude's `@` import syntax is specific to Claude.
- **Checks.** Find the project's real test, lint and build commands. Use them at the agreed
  checkpoints and record their triggers in the registry. For example, a required pull-request
  check belongs in the project's CI workflow, while a test-before-edit instruction belongs in
  `LOOPS.md`. Describe an instruction as agent-run. If the person requires enforcement, verify
  the actual trigger in their environment before marking the loop active.
- **Hooks and permissions.** The settings snippets, tool matchers, event scripts and permission
  patterns in the wiring pages target Claude Code. For a Codex hook or approval gate, inspect
  the installed Codex version and the project's supported configuration. Preserve existing
  policy. Prove the integration with a harmless failing and passing example through its real
  entry point. If the requested trigger is unavailable, record it as proposed and discuss a
  supported checkpoint with the person. Keep existing Claude wiring in mixed projects.
- **Diagnosis.** Use the read-only evidence checklist in the plugin's
  [flow auditor](../../../agents/flow-auditor.md). Gather the evidence directly when delegation
  is unavailable. Treat unavailable session or CI history as a gap in the report.
- **Service agents.** Use the shared prompt criteria. If an installable Codex subagent is
  requested, use the installed runtime's custom agent format in `.codex/agents/` and verify
  discovery. For a prompt-only request, return the prompt directly.
