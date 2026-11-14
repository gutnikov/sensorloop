---
title: Human review
type: human
summary: A person looks at the result (the diff, a demo, a sample of the agent's work, the product itself) and says whether it is what was wanted.
signal: Approval, comments on the pull request, a bug report, or a fail with a critique.
---

A person is the final judge of whether the work is what was wanted. Loops read a review where no other sensor can
settle that question.

## What it sees

Whether the work matches what was meant, not only what was written down: a feature built to the letter of a ticket
that misread the need, or a screen that passes every test and still confuses the people who use it. A reviewer sees
only what they are shown and have time for, and attention runs out: a long diff gets a shallow read.

It is the slowest and most expensive sensor. Evidence handed over with the work (a preview address, screenshots, test
reports) makes the review fast and keeps it on what only a person can judge.

## Reading the signal

- **Approval**: the person accepts the work as what was wanted.
- **Comments on the pull request**: changes asked for, each tied to a place in the work.
- **A bug report, or a fail with a critique**: the result is not what was wanted, and the critique says how.
- **No answer** is not an approval. The review has not happened yet.

A correction a person makes twice should become a rule another sensor checks, so the same mistake is caught before
review next time.
