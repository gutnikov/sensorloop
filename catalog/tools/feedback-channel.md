---
title: Feedback channel
summary: "The ways users tell the team what works and what does not: an in-product feedback command, a form, the support desk, experiment results."
sensors: [user-feedback]
layer: system
---

Feedback channels are the ways users tell the team what works and what does not. Which channels exist depends on the
product, so they are found in the product and its team's tools rather than assumed.

## Finding it

- **In the product**: a feedback command or button, a form, and where each sends what users write.
- **The support desk**: its export or its API.
- **The experiment platform**: the experiments that ran, and their results.

Access usually needs a person to grant it: these hold users' own words, and sometimes their data.

## Using it

- **Read in aggregate** over a window, grouped by topic, with counts.
- **Tie each item to the version** or the feature flag the user had, where the channel records it.
- **Strip personal data** before an item leaves the tool.
- **Read an experiment's results** only after it has run its planned length.

Examples: a `/feedback` command in the product, a feedback form, the support tool, an experiment platform.
