---
title: LLM judge
type: inferential
summary: A model scores a result, a screenshot, a sample of logs or the risk of an action against a rubric.
signal: Pass or fail with a critique, a score against a threshold, or a risk level with a short reason.
---

An LLM judge usually sits on top of a computational sensor that supplies the evidence. Loops read it where the
question is one of quality that no program can answer.

## What it sees

It sees what a rubric can describe and a model can recognise: whether a page looks broken, whether an answer helps,
whether a command is safe to run. It sees only what it is given (the screenshot, the diff, the sample), not the system
behind it.

## Cost and calibration

Each run costs a model call, and the answer varies from run to run. So a loop asks the judge an odd number of times,
three for example, and takes the majority verdict. A loop lets the judge block only once it is calibrated: on cases
an expert has already graded, its grades agree with the expert's often enough. Until then, its verdict is advice.

## Reading the signal

- **Pass or fail with a critique**: the verdict, and a reason a fix can start from.
- **A score against a threshold**: below it fails. One run's score is noisy: compare each run's score with the
  threshold, and the majority of those verdicts is the signal.
- **A risk level with a short reason**: how dangerous an action is, to decide whether it runs or a person is asked.

A judge given no evidence (an empty screenshot, a log sample with no lines) still answers, and the answer means
nothing. Check what it was given before reading its verdict.
