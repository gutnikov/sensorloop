---
title: Human answer
type: human
summary: The agent asks a person a structured question (approve a plan, choose an option, confirm a risky action) and gets an answer it can act on.
signal: Yes or no, the chosen option with its reason, or an approved plan or spec.
---

The agent asks a person a structured question (approve a plan, choose an option, confirm a risky action) and gets an
answer it can act on. Loops read it at the points where the agent should not decide alone, above all before an action
that cannot be undone.

## What it sees

The person's intent at a point the work cannot settle by itself: which option is wanted, whether a plan is right,
whether a risk is acceptable. Structured means a few options plus a free answer, the recommended one first, so
answering takes seconds rather than a conversation. It still costs a person's time and breaks their focus, and an
answer is only as good as the question it was given.

## Reading the signal

- **Yes or no**: the action may go ahead, or it must not.
- **The chosen option with its reason**: the decision, and why it was made.
- **An approved plan or spec**: what the later work is checked against.
- **A free answer**: none of the options fit. It corrects the question rather than choosing from it.

When no person is available, the agent can state its assumption and keep working, and the person confirms or cancels
it later; until then it is an assumption, not an answer. Answers are recorded with the work.
