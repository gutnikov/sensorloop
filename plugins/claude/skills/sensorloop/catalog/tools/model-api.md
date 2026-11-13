---
title: Model API
summary: A direct call to a language model with a rubric prompt and a structured answer, outside any agent.
sensors: [llm-judge, eval-set]
layer: system
---

A direct call to a language model, outside any agent: a rubric and the thing to judge go in, a structured answer
comes out. The provider is the one the project already uses, found in its configuration rather than assumed.

## Finding it

- **The provider's SDK** in the dependency manifest, and the model named in the project's config.
- **The key** in the environment (`ANTHROPIC_API_KEY`, or another provider's), never in the repository.
- **The rubrics**: prompt files in the repository, beside the graded cases they were calibrated on.

With no key or no budget, there is no call: ask a person.

## Using it

- **Pin the model version**, so a change in the score is not a change of model.
- **Ask for a structured answer**: a JSON schema or a tool the model must call, with the verdict and its reason.
- **Ask several times and take the majority**, and keep each answer.
- **A budget**: a cap on calls and tokens per run; a batch API for large sets, at a lower price.

Examples: the Claude API, other providers' APIs, promptfoo's model-graded assertions.
