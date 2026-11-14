---
title: Model check
type: computational
summary: A model checker explores, within set bounds, every reachable state of a small formal model of one critical part, such as shared credits or a protocol between services, and reports either a trace that breaks a property or no violation.
signal: The broken property with the steps from a start state to the state that breaks it, or no violation within the stated bounds.
---

Tests check the orders of events someone thought of. Where several operations change the same balance or quota at
once, or rules such as resets, refunds and top-ups interact, the defect hides in an order nobody thought of. Loops read
a model check for those parts because it tries every order within its bounds, before the code is written or while the
design changes.

## What it sees

A **formal model**: the state of one part and the steps that change it, written in a language a program can explore,
such as TLA+ or Alloy, and far smaller than the code. A **property** is a statement that must hold in every reachable
state or every run: the balance goes negative only after a refund, credits are charged only for work that succeeded.
The **bounds** are the small sizes the run is limited to: two users, three requests, ten steps. A **trace** is a
sequence of steps from a start state, and a **counterexample** is a trace that ends in a state that breaks a property.

It sees the model, not the code. It finds only what a property states: a property nobody wrote is a defect nobody
finds, and a wrong property looks like a finding until the trace is read. Within the bounds it sees every state, not
only the cases someone chose to test; beyond them it sees nothing. The bet behind small bounds is that a defect in a
design already shows with two or three of each thing.

The model and the code drift apart unless something ties them. A counterexample that shows a real defect is the script
of a test: replayed against the code (usually as two requests at once), it becomes the regression test that keeps the
defect fixed in the code, not only in the model.

## Reading the signal

- **No violation within the bounds**: every reachable state within them keeps every property. The result states the
  bounds and the number of states explored, and means nothing without them. It is not a proof beyond the bounds, and
  it says nothing of a property nobody wrote or of code that differs from the model.
- **A counterexample**: the property that broke and the trace that breaks it, step by step. A checker that searches
  breadth first, as TLC (the checker for TLA+) does by default, gives the shortest one. Either the design is wrong or
  the property is: read the trace before changing either. When the design is wrong, the trace becomes a regression
  test; when the property is wrong, fix the property and run again.
- **A deadlock**: a reachable state from which no step can follow. TLC reports it unless told not to; other checkers
  may not look for it. It is a defect where the system must always be able to go on, and expected where the model
  simply ends.
- **The run did not finish**: it ran out of time or memory before covering the bounds, or the model failed to parse.
  It has observed nothing; never read it as a pass.
- **Nothing checked**: a run with no property declared explores the states and checks none of them.
