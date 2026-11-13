---
title: Human review
type: human
summary: A person looks at the result (the diff, a demo, a sample of the agent's work, the product itself) and says whether it is what was wanted.
signal: Comments on the pull request, a bug report, or pass or fail with a critique.
---

A person looks at the result (the diff, a demo, a sample of the agent's work, the product itself) and says whether it
is what was wanted. It is the final judge of intent, and loops read it where nothing else can decide that.

## What it sees

Whether the work matches what was meant, not only what was written down: the right problem solved, in a way that fits
the product and its users. It is the slowest and most expensive sensor, and a person's attention runs out. Evidence
handed over with the work (a preview address, screenshots, test reports) makes the review fast and keeps it on what
only a person can judge. A reviewer sees what they are shown and have time for: a long diff gets a shallow read.

## Reading the signal

- **Approval**: the person accepts the work as what was wanted.
- **Comments on the pull request**: changes asked for, each tied to a place in the work.
- **A bug report, or a fail with a critique**: the result is not what was wanted, and the critique says how.
- **No answer** is not an approval. The review has not happened yet.

A correction a person makes twice should become a rule another sensor checks, so the next one is caught before review.
