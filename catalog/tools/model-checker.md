---
title: Model checker
summary: Explores every reachable state of a formal model within set bounds, checks the stated properties in each, and prints a trace to any state that breaks one.
sensors: [model-check]
layer: project
---

A model checker runs a formal model instead of the code: it starts from each initial state, takes every step the model
allows, and checks the properties in every state it reaches. It is for one critical part, such as credits and
subscriptions or a protocol between services, never for the whole product.

## Finding it

- **The models**: `.tla` files with their `.cfg` files (TLC's configuration: the constants, and the invariants and
  properties to check), or `.als` files for Alloy. Often in a `specs/` or `models/` folder.
- **CI or the task file**: the job or task that runs the checker on the models.
- **Its runtime**: TLC comes in `tla2tools.jar` and needs Java; Apalache has its own command; the Alloy Analyzer is a
  Java application.

When the project has none, writing a model is a decision for a person. A model costs time to write and to keep up with
the design, and it pays off only where several operations change the same counters at once, or where rules interact.
An example of the race in the spec comes first; a model, when that example is not enough.

## Using it

- **Run it**: `java -cp tla2tools.jar tlc2.TLC -config Spec.cfg Spec.tla` for TLC;
  `apalache-mc check --inv=Inv --length=10 Spec.tla` for Apalache, which checks runs of up to that many steps; a
  `check <assertion> for <scope>` command in the model for Alloy.
- **Small bounds, stated with every result**: small sets of model values for the constants in TLC (two users, three
  requests), `--length` in Apalache, the scope and the `steps` in Alloy.
- **Unknown rules as constants**: a rule nobody has decided becomes a constant, so one run covers each variant of the
  policy, and the result shows which variants break a property.
- **Show it catches a broken model**: remove a guard, such as the balance check, and the run must find a trace. A
  property that never fires on a broken model checks nothing.
- **Each counterexample becomes a test** of the code, usually at the API, and a fix to the policy becomes a rule or a
  question in the spec.
- **In CI on every change to the model**, with a time limit, since a run can take far longer than expected.

Examples: TLC and Apalache for TLA+, the Alloy Analyzer.
