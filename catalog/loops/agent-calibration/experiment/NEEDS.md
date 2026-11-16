# What this experiment needs from the harness

- **CI as the project's workflow runs it, steps the agent adds included.** The person's CI is the fixed list in
  `experiment.yaml`, so the review step the agent adds to `.github/workflows/ci.yml` never runs in the session. On
  GitHub it would, on `invoices/`: a reviewer that blocks good lines would turn the pull request red, and the person
  would say so. Running the workflow's `run:` steps as written (with the model's settings for the steps that need
  them) would close that gap. Until then, the judge measures what that step would block, on lines the expert graded.
