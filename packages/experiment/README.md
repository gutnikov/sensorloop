# Before/after experiments of a loop

An experiment shows what one loop changes in a person's day. The same task runs in two arms that differ only by the
loop: arm A, the project as its team keeps it; arm B, the same project with the loop wired by the sensorloop skill.
Each run is a fresh container, recorded as the person sees the screen, and scored by programs.

## Run one

You need Docker and a credential for the model, in a file outside the repository (it is passed to the container at
run time and never enters the image):

```bash
mkdir -p ~/.config/sensorloop && chmod 700 ~/.config/sensorloop
# DeepSeek, for the deepseek-* models: one line, DEEPSEEK_API_KEY=sk-...
$EDITOR ~/.config/sensorloop/deepseek.env && chmod 600 ~/.config/sensorloop/deepseek.env

npm run experiment -- type-check-and-build --arm A --model deepseek-flash --runs 3
npm run experiment -- type-check-and-build --arm B --model deepseek-flash --runs 3
```

Options: `--runs N` (`--runs 0` only builds the images), `--parallel N` (containers at a time, 2 by default),
`--label name` (the folder the runs go to, today's date by default). The models and the credential file each needs are
in `models.yaml`; an experiment's `experiment.yaml` may add its own. Runs go to `catalog/loops/<id>/experiment/runs/<label>/`, which is not committed: a cast and
a transcript hold everything the agent printed or read, so read them before you share them. Each run's scores are a
line in `runs/<label>/runs.jsonl`; `node packages/experiment/src/score.js <run dir>` scores a run again.

## What an experiment is

A folder beside its loop's card, `catalog/loops/<id>/experiment/`, or one of several in
`catalog/loops/<id>/experiments/<name>/`, run with `--name <name>`:

| File | What it holds |
|---|---|
| `experiment.yaml` | the question, the task, the CI, the arms, the models, the person's limits and the metrics |
| `Dockerfile` | the sandbox: `FROM` the base image, plus the project's stack and the fixture |
| `fixture/` | the project the agent works on, or what this experiment changes in a shared one (`fixtures/`); its history is made when the image is built |
| `task.md` | what the person pastes into the session |
| `arms/<arm>/` | what the arm adds to the project, in one commit before the session; `*.append` files are appended. An arm in `experiment.yaml` may also change the person (`arms.<arm>.person`), e.g. a person who watches only in arm B |
| `hidden/` | the judge: the checks of the feature and of the loop's behaviour, copied into the project only after the session; and a `reference.patch` that passes them |
| `results/<label>/` | the committed results: the scores of every run, and the two runs shown on the loop's page |

## How a run goes

The runner (`src/run.js`) builds two images: the base (`base/Dockerfile`: Claude Code and asciinema at pinned
versions, tmux, git, a user with an empty home) and the experiment's own, from it. The experiment's build gets two
named contexts: `fixtures` (the shared projects in `fixtures/`, such as `invoicer`) and `plugin` (the plugin's hook
scripts, which arm B copies to `.sensorloop/hooks/`). Then, for each run, a fresh
`docker run --rm` of the experiment's image runs the driver (`base/driver/session.mjs`) as root:

1. It blocks the hosts `blocked_hosts` names (in `/etc/hosts`, never the model's API), applies the arm's overlay in
   one commit, and stops if the project differs from arm A's by anything else.
2. It starts Claude Code as the user `node` in a tmux pane 90 columns wide, recorded by `asciinema rec`. The model
   comes from `experiment.yaml`; permissions are skipped (the container is thrown away), and the question tool is off
   in every arm, since no one is there to answer.
3. It pastes the task and waits until the agent ends its turn: no spinner, nothing running under Claude Code, and the
   transcript quiet for ten seconds.
4. It plays the person. When Claude Code asks before a command, the person answers as `person.permission` says
   (yes, or no with a message). While the agent works, the person may watch: when a tool call matches one of
   `person.watch` (a pattern over the call's name and input), it presses Esc and says its message. When the agent
   ends its turn, the person first says what it has to say, in order (`person.first_reply`, then `person.replies`:
   an answer, a correction, a reviewer's comments), and then runs the project's CI. Green, and the code changed: the run ends. Red: it types what a
   person would ("CI is red on your branch: `npm run typecheck` fails." and the first error lines), at most
   `person.max_reports` times. No change to the code at all (the folders in `code_paths`, `src` by default): it asks the agent to go ahead.
   A run may hold several sessions one after another, in the same project and home (`sessions`: each a `task` and
   its own `person`), for a loop that works across sessions; each session's cast is `session-<n>.cast`.
5. It ends the session, copies in the judge and runs it (`node <judge> /work /out`, with `SETUP_COMMIT` and
   `BASE_COMMIT` set, so it can read the diff and the transcript; with `judge_gets_model: true` in `experiment.yaml`
   it also gets the model's settings, to run evals; `judge_minutes` sets its time limit, 10 by default), and writes
   to `/out`: the cast, the transcript, the
   diff, each CI run, the acceptance results and `run.json`. The credential is scrubbed from every file.

The agent cannot read `/experiment`, where the other arm and the hidden checks are.

## Scores

**The first hand-over.** At the agent's first "done" with a change to the code, the driver keeps a copy of the
project's files (`first-handover/` in the run). After the run, the judge grades that copy as well as the end: the first
hand-over is what the person receives before anyone has said anything about it, and a mistake the person's reports
later got fixed still counts there. How much the person had to do to get from it to the end is its own measure.

**Whether a run made the loop's mistake** is the experiment's `qualify` rule in `experiment.yaml`, judged at the first
hand-over: `check:<name>` fails, `pass:<name>` passes, `value:<name>` is true, `ci:<step>` was red at the first "done";
a trailing `*` matches a prefix, and a list inside the list means all of it. `qualify_also` names other loops the same
task judges; `judge_at: end` judges at the end instead, for a mistake that shows only later (a second session).
`node packages/experiment/src/report.js [--label <label>]` prints, per experiment and set of runs, how many
runs made the mistake and every check that failed at the first hand-over, the loop's or not.

**The judges are calibrated on real runs.** A reader goes through real runs and compares its verdicts with the
judge's; the disagreements, and what changed in the judge, are in `hidden/CALIBRATION.md`.


`src/score.js` reads a run's files. Verdicts: CI green at the agent's first "done"; every check of the judge passing
at the end (a judge prints one JSON line per check, `{name, pass}`, or per measure, `{name, value}`). Counts: the person's reports, the hook's refusals, the type checks and test runs the agent ran itself,
suppressions added (`@ts-ignore`, `as any`), test files changed or deleted, tokens, minutes to a green CI, the size of
the cast.

## Change an experiment

Change the fixture, the task or an arm, and run it again under a new label: the image tag follows the files, so the
runner rebuilds what changed. A change to the plugin's hook scripts reaches arm B the same way. Keep the old results:
the loop's page shows the newest, and the older ones are its history.
