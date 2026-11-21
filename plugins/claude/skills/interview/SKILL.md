---
name: interview
description: >-
  Interviews the person about what they need from their project's validation loops before any are set up or changed. It starts by finding the tools the project already has and showing them. Then it asks one or two questions a turn, for at most five turns, the ones that change the setup most first: how much the agent does on its own, what would hurt if a change broke it, what the loops may cost; then when the agent may call the person, which actions wait for them, where they approve the work. Each question offers only the options the earlier answers leave open. It looks facts up in the project instead of asking, and ends with needs the person confirms. Use when the sensorloop skill sets a project up or the project's needs change, or when the person asks to be interviewed or questioned about their needs, requirements or limits before the agent's checks are set up.
---

# Interview

In Codex, apply the [Codex integration](../sensorloop/procedures/codex.md) throughout the procedures and wiring recipes.

Before anything is set up, find out what the person needs from the project's loops, and get their word that you
understood. Loops chosen without it fit the catalog, not the project: they gate the wrong actions, spend what the
person did not allow, and miss what would hurt.

The interview ends with the person's needs, not with loops. The procedure that called it,
[setup](../sensorloop/procedures/setup.md) or [change](../sensorloop/procedures/change.md), turns them into loops
afterwards. Run on its own, it hands over to one of them: setup when the project has no `.sensorloop/loops.yaml`,
change when it has one.

## First: the tools already here

Before the first question, find which of the catalog's tools the project already has, and show them to the person.
The loops will be built with these tools, and the person should see what you found before you ask them anything.

The tools are listed in [the catalog's index](../sensorloop/catalog/index.md), under "Tools": each line names a role
and the products (vendors) that can play it. Look for them where [setup.md](../sensorloop/procedures/setup.md) step 1
says: the CI configuration, the task file, the dependency manifests and lockfiles, the tools' config files,
`.claude/settings.json`, `.mcp.json`, and the README. A product found means the tool is found: `vitest` in the
dependencies is the project's test command, a `.github/workflows/` folder is the CI system, `@sentry/node` is the
error tracker. List only what you found evidence for, with where you found it, and never what the stack usually has.
Leave out what every Claude Code session has (plan mode, the question tool, permission rules) unless the project
configured it. When the search is long, give it to a subagent with a fresh context and the index.

Show one table, grouped as the catalog groups tools: in the project, outside the project, in the coding agent.

```
| Tool | Found | Where | Builds |
|---|---|---|---|
| The project's test command | `npm test` (node --test) | package.json, CI | test runner |
| The CI system | GitHub Actions | .github/workflows/test.yml | CI results |
```

Under the table, add one line about what the repository cannot show (an error tracker, a log store or metrics live
outside it), and tell the person they can name any they use. That line is not a question, so do not wait for an
answer to it. Put the first questions in the same message. When the code shows what is being built, say it here too,
in one sentence the person can correct.

When the registry already lists the project's tools (`project.tools`), show only what changed since then: the tools
that are new, and the ones that are gone.

## The tree

Map the needs as a **tree**: each answer opens the questions that hang off it and closes the ones it makes moot. A
project with no deploy has no question about how a broken deploy is noticed. The branches are in [tree.md](tree.md).
For each branch it gives the weight, the question in plain words, the facts to read before asking it, what its answers
open, the loops it decides, the options left by earlier answers, and the default. Grow the tree from what you learn.
A branch the project calls for that tree.md lacks is yours to add; a branch the facts settle is not asked.

## What to ask first

Each branch in tree.md has a **weight**, which says how much its answer changes the setup:

- **High**: the answer decides which loops can exist at all. How much the agent does on its own, what would hurt if a
  change broke it, what the loops may cost, where a change goes (when the repository does not show it), and what is
  being built (when the code does not show it).
- **Medium**: the answer changes how the loops hold and whom they reach. When the agent may call the person, which
  actions wait for them, where they approve the work, how a break in production is found.
- **Low**: the answer changes a detail of the wiring that a default settles well. Who reviews, whether the tests are
  trusted, how long a check may hold the agent, what the setup must leave alone.

Ask by weight: every open high question before any medium one, and every medium one before any low one. Among
questions of the same weight, ask first the one whose answer opens or closes more of the tree. A question still waits
for the ones it hangs off: what would hurt waits for what is being built. Ask a low question only when a turn is left
for it. Usually a low branch takes its default, and the summary shows it, marked assumed, so the person can correct
it.

Ask only what changes the setup. If no answer to a question would change which loops run, what they gate, when they
fire or what they may cost, leave it out.

## Facts are yours, needs are the person's

A **fact** is what the project can tell you: its tools, its commands and how long they take, its CI, where a change
is deployed, what already checks the work. Find it yourself, where [setup.md](../sensorloop/procedures/setup.md)
step 1 says to look, and never ask the person what you can read or run. When the reading is long, give it to a
subagent with a fresh context, and do not wait for it: only the questions that depend on its report wait.

A **need** is the person's: what would hurt, what the agent may do alone, where they want to step in, what the loops
may cost, what must not change. Put each one to them, with your recommendation, and wait. Never settle one yourself,
even when you are sure.

A fact that should worry the person (main is red, a deploy has no check after it, the tests do not run) is still a
fact: show it, and ask what they want done about it.

## Turns

Ask **one or two questions a turn**, then wait for the answers. Ask two only when both are open now and neither
depends on the other's answer; otherwise ask one. Ask in **at most five turns**, so at most ten questions in all. At
the start, list the open questions by weight and plan the five turns: the questions that fit are asked, and the rest
take their defaults.

After each answer, work out again what is open. Settled branches open the questions under them and close the ones
they made moot. When an answer changes one you already have, reopen that branch in the next turn and say why; the
reopened question counts as one of the ten.

## Options follow the answers

Each question offers only the options the answers so far leave open, and its recommendation follows from them and
from the facts. An option an earlier answer ruled out is not offered. For example:

- Nobody watches the agent: the question on when it may call the person does not offer "in the session, whenever it
  is unsure"; it offers a pull request, an issue or a message, and at what hours.
- No model calls besides the coding agent: no option or recommendation rests on a reviewer agent or a model judge.
- The deploy is the only action the person named as hard to take back: the question on what waits for them names the
  deploy command found in the project first, and not a migration the project does not have.
- The person named what would hurt: later questions use that harm, in their words.

Name the project's own tools and commands, from the table, in the options. When the earlier answers leave only one
option, the branch is settled: do not ask it, and state it in the summary.

## The format

Number the questions across the whole interview (Q1, Q2, … up to Q10), and put your recommendation on its own line,
worded so that "yes" accepts it:

```
🧭 **Q1 · <short title>**: <one question, about this branch only, in the person's words: the options the earlier
answers leave open, and the fact behind it, if there is one>

💡 <one answer, never "a or b", and what it rests on>

---

🧭 **Q2 · <short title>**: …

💡 …
```

Keep each question to its own branch: a question does not carry another one (what would hurt, who would notice a
break, which actions wait) in its body or in its recommendation. The recommendation on what would hurt does not go on
to say what you would gate, and the one on how much the agent does alone does not say when it should call the
person: those are later questions, asked in their own turn. A recommendation is one answer, not a choice between two:
when no fact or earlier answer points to one, recommend the branch's default from tree.md, and say so.

The person can answer by number: "1 yes, 2 the second, because …". A turn may also go through the question tool,
with the options the earlier answers leave open, the recommended option first and marked "(Recommended)".

Ask about the work, the product and the people, in their words, not the catalog's: "What would hurt most if a change
broke it?", not "Do you need mutation testing?". Loops are what the setup answers with, later.

"I don't know" is an answer. Take the branch's default from tree.md, mark it assumed, and say so. A question that
talking cannot settle (are the tests good enough to trust? how often will the agent get stuck?) is answered by a fact
instead: run something, or let a loop show it, and say which.

The person owns the scope. When they push back on a question, follow them. When they say it is enough, stop, take the
defaults for the branches still open, and mark them assumed.

## The end

After the last turn of questions (the fifth at most, or earlier when nothing worth asking is left), show the person
what you heard, one line per need or limit, in their words. Mark the assumed ones: every branch that took its default,
because it was not asked or the answer was "I don't know". Ask them to confirm or correct it. This confirmation is not
one of the five turns. Take a correction as said, without asking about it again. Set nothing up until they confirm.

What they confirm goes into the registry, `.sensorloop/loops.yaml`, and nowhere else (not in `CLAUDE.md`, not in
`LOOPS.md`): what the loops must not do or cost goes in `project.limits`, the rest in `project.wants`, the tools found
in `project.tools`, and the date in `project.interviewed` ([loops-file.md](../sensorloop/procedures/loops-file.md)).
The procedure that called the interview writes it there with the loops. The next interview starts from it.

## When the needs change

When the project changes, or the person wants the loops to do something else, start with the tools (only what changed
since the registry) and then the registry: its wants and limits are settled. Reopen only the branches the change
touches ([tree.md](tree.md) says which) and the ones the person names. A settled branch is not asked again, not even
to confirm it: say in one line which wants and limits stand, and the person can reopen one. A recorded answer the
change contradicts (a limit that the agent is always watched, when it will now work alone) is not settled: it belongs
to the reopened branch. Ask the reopened branches by weight, one or two questions a turn, in at most five turns, with
options that follow the new answers, and end as above.

## When nobody can answer

If the person said they are not available, do not interview yourself: an interview nobody answers yields your opinion,
not their needs. Still find the tools, and show them at the end. Take the defaults in tree.md for the branches the
facts leave open, record each in the registry marked assumed, and say what you assumed. The next interview asks those
first.
