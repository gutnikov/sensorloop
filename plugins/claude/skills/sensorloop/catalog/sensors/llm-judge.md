---
title: LLM judge
type: inferential
summary: A model scores a result, a screenshot, a sample of logs or the risk of an action against a rubric.
signal: Pass or fail with a critique, a score against a threshold, or a risk level with a short reason.
---

An LLM judge is a model asked to score one thing against a rubric: a result, a screenshot, a sample of logs, or the
risk of an action. It usually sits on top of a computational sensor that supplies the evidence, and loops read it
where the question is one of quality that no program can answer.

## What it sees

What a rubric can describe and a model can recognise: whether a page looks broken, whether an answer helps, whether a
command is safe to run. It sees only what it is given (the screenshot, the diff, the sample), not the system behind
it. It costs a model call each time, and its answer varies from run to run, so it is asked several times and the
majority taken. Before it may block, it is calibrated against an expert's grades.

## Reading the signal

- **Pass or fail with a critique**: the verdict, and a reason a fix can start from.
- **A score against a threshold**: below it fails. One run's score is noisy; the majority of several is the signal.
- **A risk level with a short reason**: how dangerous an action is, to decide whether it runs or a person is asked.

A judge given no evidence (an empty screenshot, a log sample with no lines) still answers, and the answer means
nothing. Check what it was given before reading its verdict.
