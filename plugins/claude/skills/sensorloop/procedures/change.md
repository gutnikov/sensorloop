# Change: the project moved, the loops follow

The project has `.sensorloop/loops.yaml`, and something changed: a new language or framework, a renamed or new
command, CI added or moved, a deploy or preview set up, or what the person needs from the loops. Goal: the registry,
the wiring and `LOOPS.md` match the project and the person's needs again.

## 1. Compare

Read `.sensorloop/loops.yaml`. Find the tools and learn the project again as in [setup.md](setup.md) step 1, and
compare:

- **Tools**: which of the catalog's tools are new since `project.tools`, and which are gone. Show the person these
  before anything else.
- **Commands**: does each recorded command still run as CI runs it? A renamed, moved or new command changes every
  hook that calls it.
- **Facts**: what the project now has or lost (CI, deploy, previews, telemetry).
- **Wiring**: do the hooks in `.claude/settings.json` and the CI jobs still match the registry? Someone may have
  edited one and not the other.
- **Needs**: when the change touches what the person needs, interview them again, starting from the wants and limits
  in the registry and reopening only the branches the change touches
  ([../../interview/SKILL.md](../../interview/SKILL.md), "When the needs change"). When the change is to the needs
  themselves (a new risk, an action that must now wait for a person, a budget lifted), the interview is this step.

## 2. Propose the difference

List, for the person: loops whose wiring must change (and how), loops that can no longer run (to turn `off`), and
loops the new facts or needs call for: to wire, from their page in [wiring/](../wiring/) or from their card, when the
project can run them, or to propose, when they need what only a person can provide ([setup.md](setup.md) step 3).
Get a yes.

## 3. Apply, prove, write down

Change the wiring, prove each changed loop works ([setup.md](setup.md) step 5), update `loops.yaml` (its tools, and
its wants and limits too, when the interview changed them), rewrite `LOOPS.md`, and end with the report
([setup.md](setup.md) step 7) on the loops that changed. Never turn a loop off to make a change pass: a
loop that blocks a change is doing its job until the person decides otherwise.

When the person only asks for `CLAUDE.md` to be current, check that `LOOPS.md` matches `loops.yaml` and that
`CLAUDE.md` imports it; rewrite `LOOPS.md` if it drifted.
