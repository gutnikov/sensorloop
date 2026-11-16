---
name: interview
description: Interviews the person about what they need from their project's validation loops before any are set up or changed. It asks first what is being built, how much the agent should do on its own and when it may call the person, then what follows from those: where a change goes, what would hurt if it broke, which actions wait for a person, where they want to approve the work, what the loops may cost. It asks in rounds, looks facts up in the project instead of asking, and ends with needs the person confirms. Use when the sensorloop skill sets a project up or the project's needs change, or when the person asks to be interviewed or questioned about their needs, requirements or limits before the agent's checks are set up.
---

# Interview

Before anything is set up, find out what the person needs from the project's loops, and get their word that you
understood. Loops chosen without it fit the catalog, not the project: they gate the wrong actions, spend what the
person did not allow, and miss what would hurt.

The interview ends with the person's needs, not with loops. The procedure that called it,
[setup](../sensorloop/procedures/setup.md) or [change](../sensorloop/procedures/change.md), turns them into loops
afterwards. Run on its own, it hands over to one of them: setup when the project has no `.sensorloop/loops.yaml`,
change when it has one.

## The tree

Map the needs as a **tree**: each answer opens the questions that hang off it and closes the ones it makes moot. A
project with no deploy has no question about how a broken deploy is noticed. The branches are in [tree.md](tree.md):
for each, the question in plain words, the facts to read before asking it, what its answers open, the loops it
decides, and its default. Grow the tree from what you learn. A branch the project calls for that tree.md lacks is
yours to add; a branch the facts settle is not asked.

The tree has three roots, and the first round asks them and nothing else:

1. **What is being built**, and who relies on it. Ask only when the code does not show it; otherwise say what you
   found, so the person can correct it.
2. **How much the agent does on its own**: watched step by step, a task handed over, many tasks with nobody watching.
3. **When the agent may call the person**: whenever it is unsure, only before what cannot be undone, only at agreed
   points, or never while it works; and how, and at what hours.

Every other question (where a change goes, what would hurt, which actions wait for a person, who reviews, what the
loops may cost) hangs off these three and waits for a later round.

Ask only what changes the setup. If no answer to a question would change which loops run, what they gate, when they
fire or what they may cost, leave it out.

## Facts are yours, needs are the person's

A **fact** is what the project can tell you: its commands and how long they take, its CI, where a change is deployed,
what already checks the work. Find it yourself, where [setup.md](../sensorloop/procedures/setup.md) step 1 says to
look; never ask the person what you can read or run. When the reading is long, give it to a subagent with a fresh
context, and do not wait for it: only the questions that depend on its report wait, and you ask the rest now.

A **need** is the person's: what would hurt, what the agent may do alone, where they want to step in, what the loops
may cost, what must not change. Put each one to them, with your recommendation, and wait. Never settle one yourself,
even when you are sure.

A fact that should worry the person (main is red, a deploy has no check after it, the tests do not run) is still a
fact: show it, and ask what they want done about it.

## Rounds

Work the tree in **rounds**. The **frontier** is every open question whose prerequisites are settled: what you can ask
without guessing an answer you have not heard. Ask the whole frontier in one round, then wait for the answers. A
question that depends on another one still open belongs to a later round, not this one.

Each round of answers reshapes the tree: settled branches open the questions under them and close the ones they made
moot. Work out the new frontier and ask it. When an answer changes one you already have, reopen that branch in the
next round and say why.

Number the questions, and put your recommendation on its own line, worded so that "yes" accepts it:

```
❓ **Q1 · <short title>**: <the question in the person's words, the options when there are some, and the fact
behind it, if there is one>

➡️ <your recommended answer, and what it rests on>

---

❓ **Q2 · <short title>**: …
```

The person can then answer the round by number: "1 yes, 2 the second, 3 no, because …". A round of at most four
questions, each with a few clear options, may go through the question tool instead, with the recommended option first
and marked "(Recommended)".

Ask about the work, the product and the people, in their words, not the catalog's: "What would hurt most if a change
broke it?", not "Do you need mutation testing?". Loops are what the setup answers with, later.

"I don't know" is an answer. Take the branch's default from tree.md, mark it assumed, and say so. A question that
talking cannot settle (are the tests good enough to trust? how often will the agent get stuck?) is answered by a fact
instead: run something, or let a loop show it, and say which.

The person owns the scope. When they push back on a question, follow them. When they say it is enough, stop, take the
defaults for the branches still open, and mark them assumed.

## The end

The interview is done when the frontier is empty: every branch visited, nothing assumed in silence. Then show the
person what you heard, one line per need or limit, in their words, with the assumed ones marked, and ask them to
confirm or correct it. Set nothing up until they confirm.

What they confirm goes into the registry, `.sensorloop/loops.yaml`: what the loops must not do or cost in
`project.limits`, the rest in `project.wants`, and the date in `project.interviewed`
([loops-file.md](../sensorloop/procedures/loops-file.md)). The procedure that called the interview writes it there
with the loops. The next interview starts from it.

## When the needs change

When the project changes, or the person wants the loops to do something else, start from the registry: its wants and
limits are settled. Reopen only the branches the change touches ([tree.md](tree.md) says which) and the ones the
person names, and say in one line that the rest stand. Work the reopened branches in rounds, and end as above.

## When nobody can answer

If the person said they are not available, do not interview yourself: an interview nobody answers yields your opinion,
not their needs. Take the defaults in tree.md for the branches the facts leave open, record each in the registry
marked assumed, and say what you assumed. The next interview asks those first.
