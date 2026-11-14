---
title: Model API
summary: A direct call to a language model with a rubric prompt and a structured answer, outside any agent.
sensors: [llm-judge, eval-set]
layer: system
---

A direct call to a language model, outside any agent. For an LLM judge, a rubric and the thing to judge go in, and a
verdict with its reason comes out. In an eval set it does two jobs: it runs the prompt under test on each case, and it
grades the cases whose answer no fixed assertion can check. The provider is the one the project already uses: look
for it in the project's configuration rather than assume one.

## Finding it

- **The provider's SDK** in the dependency manifest, and the model named in the project's config.
- **The key** in the environment (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or another provider's), never in the
  repository.
- **The rubrics**: prompt files in the repository, beside the graded cases they were calibrated on.

Without a key or a budget, make no call: ask a person for them.

## Using it

- **Pin the model version**, so a change in the score is not a change of model.
- **Ask for a structured answer**: a JSON schema or a tool the model must call, with the verdict and its reason.
- **Ask an odd number of times, three for example, and take the majority**, and keep each answer.
- **Cap the calls and tokens per run**, and send large sets through a batch API, at a lower price.

Examples: the Claude API, the OpenAI and Gemini APIs, promptfoo's model-graded assertions.
