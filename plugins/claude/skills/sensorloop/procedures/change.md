# Change: the project moved, the loops follow

The project has `.sensorloop/loops.yaml`, and something changed: a new language or framework, a renamed or new
command, CI added or moved, a deploy or preview set up, a limit the person changed. Goal: the registry, the wiring and
`LOOPS.md` match the project again.

## 1. Compare

Read `.sensorloop/loops.yaml`. Learn the project again as in [setup.md](setup.md) step 1, and compare:

- **Commands**: does each recorded command still run as CI runs it? A renamed, moved or new command changes every
  hook that calls it.
- **Facts**: what the project now has or lost (CI, deploy, previews, telemetry).
- **Wiring**: do the hooks in `.claude/settings.json` and the CI jobs still match the registry? Someone may have
  edited one and not the other.
- **Limits**: ask the person whether the limits still hold, if the change touches them.

## 2. Propose the difference

List, for the person: loops whose wiring must change (and how), loops that can no longer run (to turn `off`), and
loops the new facts make possible (to wire, if they are in [wiring/](../wiring/), or to propose). Get a yes.

## 3. Apply, prove, write down

Change the wiring, prove each changed loop fires ([setup.md](setup.md) step 5), update `loops.yaml`, and rewrite
`LOOPS.md`. Never turn a loop off to make a change pass: a loop that blocks a change is doing its job until the person
decides otherwise.

When the person only asks for `CLAUDE.md` to be current, check that `LOOPS.md` matches `loops.yaml` and that
`CLAUDE.md` imports it; rewrite `LOOPS.md` if it drifted.
