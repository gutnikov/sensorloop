---
title: Read third-party extensions before they run
summary: On each pull request that adds or moves the pin of a third-party plugin, skill or MCP server, a reviewer reads every file it ships against a written policy, and a fail keeps the pin out; verdicts are cached per commit and policy.
sensors: [llm-reviewer]
when: On every pull request that adds an extension or moves its pin, once per new pin; and on every pull request that changes the policy, over every pinned extension.
failure: A pin that breaks the policy, such as a hook on every session with no gate, telemetry the description does not disclose, a credential sent to a service that does not own it, or behaviour the install description leaves out. Also a cached fail at the same commit, and an entry the scan left without a verdict.
next: The author of the change, an agent or a bot, drops the failing pin or reverts it; nobody patches the extension, and it comes back only at a new commit that passes. Until the reviewer is calibrated on extensions a person checked, a fail goes to a person's review of the pull request instead of blocking. A person settles a disputed fail, and their override becomes an eval case.
---

## The loop

1. On every pull request, a job compares the extension manifest (a marketplace file, an MCP server config, a plugin
   lock file) with the base branch, and takes each new extension and each new pin.
2. Each is looked up in a cache of verdicts. A hit is reused, a fail as much as a pass; a miss goes to the reviewer.
3. The reviewer gets the extension at its pinned commit, its install description and the policy, and reads every
   file, hidden folders included: a plugin installed from git ships the whole repository, and all of it can be run.
4. The policy asks four things:
   - **Hooks**: one on every prompt or tool call that is not gated to the projects it serves fails, network or not.
   - **Telemetry**: a call to any host but the declared MCP servers fails unless the description or the README
     discloses it with an opt-out, even when the payload is anonymous.
   - **Credentials**: one belongs to the service its name or its storage place names, whatever the extension claims.
     A GitHub token sent to GitHub passes; the model provider's key sent to a third-party gateway fails.
   - **The description**: would a user who read only the install description be surprised by what was found? A
     mismatch about hooks, telemetry or data access fails; a cosmetic one does not.
5. The reviewer fills in the policy's fields, each reason citing a file and line or a hook. A script, not the model,
   derives the verdict from them, so an answer that raises a flag and still says pass fails.
6. The job fails on any fail, fresh or cached, and on an entry left without a verdict. Each entry gets one comment
   on the pull request, updated in place, that cites the evidence and says what the user was not told.

## Why

A plugin, a skill, a hook or an MCP server runs inside the agent, with its permissions, in every session where it is
installed: a hook can see every prompt, and a hidden script can read the keychain and send a token anywhere. None of
it is a known vulnerability, so no vulnerability scan sees it. The code does what its author wrote, which can be more
than its description says. This loop reads the whole payload at each new pin, against what the user was told.

## Set up

- **The policy is a file**, a prompt and the JSON schema of its answer, with code owners. Text in an extension that
  addresses the reviewer is a violation, not an instruction.
- **The cache key** is the name, the commit and the whole source entry, under a hash of the policy: the same commit
  from a moved repository is scanned again, and a policy edit misses every entry. Verdicts are kept 30 days, and one
  branch's scans run one at a time, so none loses another's verdicts.
- **No verdict is a fail.** A scan that errors, or an output that does not parse, fails the job and is never cached.
  The gate counts verdicts against the entries sent, so an entry the scan never answered for does not pass.
- **The reviewer has little to lose**: tools that only read the checkout, no network, no write token, and a
  credential that expires in minutes; without one, the job fails instead of skipping. Keys are redacted from output.
- **Model output is inert where it is posted**: `|`, `[`, `]`, `<`, `>`, backticks and line breaks become spaces,
  and the text is wrapped in a code span and cut. A code block is no shelter: three backticks in the text close it.
- **Calibrated on the whole catalogue**: every pinned extension with a verdict a person confirmed. A policy edit
  re-scans them all, and a person reviews every verdict that flipped before it merges: a narrowed credential rule
  can let through a plugin that claims the provider's key as its own, and only the whole catalogue shows it.
- **Wiring.** A required check with no path filter, which skips inside the job when neither the manifest nor the
  policy changed. The cache lives in CI, and a hook refuses the agent's writes to the policy and the workflow.
