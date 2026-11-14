---
title: Loop outcomes
type: computational
summary: Reads the record of what the loops caught and missed (escapes, corrections, unconfirmed releases) to find the loop that should have caught a problem earlier.
signal: Escapes, corrections and unconfirmed releases counted per phase and kind, and the earliest phase that could have caught each.
---

This sensor serves the metaloop. It finds the loop that should have caught a problem, or should have caught it
earlier, so that the loops can be improved.

## What it sees

Escapes (problems that got past the phase meant to catch them), corrections and unconfirmed releases, counted per
phase and kind, each with the earliest phase that could have caught it. An entry reads, for example: an unhandled
empty input, found in production by the error tracker, that the unit tests could have caught. It needs the loops to
record their outcomes as they happen. It cannot see a problem no loop or person ever noticed, and it knows nothing
that was not written down.

## Reading the signal

- **An escape**: a problem was found later than it could have been. The record names where it was found and the
  earliest phase that could have caught it.
- **A correction**: a person or a later sensor changed work that an earlier loop had passed.
- **An unconfirmed release**: after a release, real traffic did not confirm the change. Production did not run it, its
  own signal did not appear, or something got worse than under the previous version. Every loop before production
  had passed it.
- **The same kind caught late twice**: a reason to add a loop, or to move one earlier.

An empty record is not a clean one: if the loops stopped writing their outcomes, the sensor sees nothing. Check that
recent runs appear in the record before reading silence as success.
