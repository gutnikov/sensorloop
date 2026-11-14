# The wizard

The wizard at [/wizard/](https://sensorloop.dev/wizard/) asks at most eight questions about a project and answers with
the loops it needs: the base that every project gets, the five to start with, the five to add next, the rest by phase,
the ones that wait for something the project lacks, and the ones its answers rule out.

| File | What |
|---|---|
| `tree.yaml` | The questions, the rules that turn answers into loops, and each loop's phase. Its header says how a result is computed. |
| `../schema/wizard.schema.json` | The shape of `tree.yaml`. The loader also checks its references: every loop it names has a card, every catalog loop has a phase and is reached by some answer, every condition reads a question asked before it. |
| `personas/` | The eighteen projects the tree is tried on. Each holds the developer's own account (`who`), the loops it must and must not get (`expect`), and its answers from the latest round. |
| `review.md` | The brief of the agent that reviews the wizard as one persona, in a round. |
| `../../packages/catalog/src/wizard.js` | The engine: which questions are asked, and the result. The page runs it in the browser. |
| `../../packages/catalog/src/wizard-cli.js` | The same on the command line, for the rounds. |

`npm run check` fails when the tree does not fit its schema or the catalog, when a persona's answers do not fit the
questions, or when a persona does not get a loop it must have, or gets one it must not.

## Change the tree

Edit `tree.yaml`, then run `npm run check`. A new loop in the catalog fails the check until it has a phase and a rule
that reaches it. A rule gives each loop it adds its own reason, written for the answer that triggers it, and a weight:
4 for what defines how the work runs, 3 for a risk the person named, 2 for what the product is, 1 by default, 0 for a
loop to add once the rest runs. The result shows a loop's strongest reason only, so a reason must hold on its own.

To see what a set of answers gets:

```bash
node packages/catalog/src/wizard-cli.js run catalog/wizard/personas/01-solo-saas-local.yaml
node packages/catalog/src/wizard-cli.js personas     # every persona, with its first five
```

## Run a round

A change to the questions, or to more than a few rules, is tried on all the personas, each by an agent with a fresh
context that does not see the tree or the expectations:

1. Make a folder outside the repository for the round. Put in it `questions.txt`
   (`node packages/catalog/src/wizard-cli.js questions`), `loops.txt` (`... loops`), and each persona's `who` as
   `<persona>.who.txt`.
2. For each persona, start an agent with: "Follow the instructions in `catalog/wizard/review.md`; `<round>` is the
   round's folder, `<persona>` is `<id>`." It answers the questions as that developer, runs the result, and writes its
   answers and a review with each finding's severity.
3. Read the high and medium findings across the personas. Fix what more than one persona points at, or what a persona
   could not answer truthfully; a finding that only one persona raises and another contradicts is a trade-off, not a
   bug. Write the round's answers into the persona files and run `npm run check`.
4. Run another round, until a round brings no high finding that the tree can fix.

## How it was built

Seven rounds on 2026-11-14, eighteen personas each, with each round's reviewers on Claude Sonnet.

| Round | High | Medium | What changed after it |
|---|---|---|---|
| 1 | 53 | 177 | A reason per loop (a rule's one sentence had shown under every loop it added); weights and a "start with" tier (results of 15 to 37 loops had no order); risk options for actions that cannot be taken back, a compromised dependency, wrong numbers, legacy code; questions in plain words. |
| 2 | 28 | 124 | A "next" tier; loops that call a model left out, with the reason, when the person allows none; tests as pick-all (a suite can be slow and flaky); a game is its own product; `db-migration-lint` only for products that run migrations. |
| 3 | 7 | 98 | A production database as a fact of where a change goes, not only a risk; no limit on the risks to pick; a CI as a first step for a project nobody reads the code of. |
| 4 | 9 | 91 | "Money" means payments and costly jobs, not an agent's spend; a base loop a named risk calls for most shows among the first steps; reasons sorted by weight. |
| 5 | 4 | 70 | Among equal totals, the loop one answer calls for most comes first; weights for the fleet, the CI agent, backups and infrastructure's configuration. |
| 6 | 7 | 79 | Saves and local data count as data people cannot lose; policy rules for infrastructure under attack; a data pipeline's release confirmed by its numbers. |
| 7 | 1 | 75 | Stopped: the one high finding is the fleet persona wanting a sixth loop among its first five. |

What is left is mostly the order inside the first ten loops, where personas of the same kind disagree from round to
round. Some reviewers in every round found the base heavy for a project with no tests (a game, an agency's sites, a
founder who does not code); the base keeps the tests, with a note that the first test is a smoke test that the app
starts at all.

## The base

Seven loops fit every persona, whatever it builds and however it works: ask before the irreversible, run the tests
first, red then green, type check and build, lint with fix instructions, no secrets in commits, and a correction
becomes a rule. They are cheap (a line in the agent's instructions, a hook, a permission), the plugin wires five of
them itself, and none of them is in any persona's "must not". When a named risk calls for one of them most, such as the
gate before a broadcast or a store release, the result shows it among the first steps too.

## What the catalog lacks

Needs that came back across the rounds with no loop in the catalog to meet them:

- A guard on the product's own irreversible actions: a broadcast to every user, an AI feature acting in a customer's
  account (a dry run, a cap, a confirmation before a tool with side effects). The gates stop only the coding agent.
- Data quality: row counts, freshness and reconciliation with the previous run, and a cost estimate before a backfill.
- Policy checks on an infrastructure plan: a destroyed stateful resource, a security group open to the world, drift.
- Flaky tests: quarantine, and retries that are counted.
- Staged rollouts that halt on their own on a crash rate, and tests on a hardware rig.
- The supply chain of a published package: trusted publishing, provenance, pinned actions.
- Access rules on a database reached with a public key, such as row-level security.
- Contract tests between services, and the quality of a model's answers in production.
