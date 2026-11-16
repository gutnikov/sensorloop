# Loops in this project

Kept by sensorloop from `.sensorloop/loops.yaml`; change the registry, not this file.

## Commands

| What | Command |
|---|---|
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| Triage report of the tracker | `node .sensorloop/hooks/triage.mjs` |

## Before you change anything

Triage each item before you work on it. `node .sensorloop/hooks/triage.mjs` lists, for each item labelled `ready` in
`issues/`, the items that look like it (open and closed, by the words they share) and what it lacks to be worked; a
hook adds the same report to the session with its first prompt. The report only proposes: read each candidate's whole
file, then decide for the item:

- **A duplicate**: the same problem as an open item (the same symptom with the same likely cause; a shared word or
  file is not enough). It joins the older item, and nobody works it twice, least of all while someone is on the other.
- **Short of information**: you cannot see the problem from what it says (no way to see it, no example). Do not guess
  what the reporter meant.
- **The wrong kind**: a `bug` that asks for something different from what a feature chose on purpose is a new
  requirement, not a fix. Do not change that behaviour as a fix.

Flag such an item in its file, under `## Comments` (who, the date, what it is and why: the item it duplicates, the
information it needs, or the feature that chose the behaviour), say so in your hand-over, and do not work it. Work
only the items that pass triage. An item whose kind proves wrong while you work it goes back to triage the same way,
with the reason.

## Never

- Weaken a check to make it pass: no raised limits, disabled rules, skipped or loosened tests.
- Edit `.sensorloop/`, `.claude/settings.json` or CI files to get past a loop.
