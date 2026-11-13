---
title: Preview environment
summary: A running copy of the change, deployed for each pull request at its own address, for the checks that need the app to run.
sensors: [browser-run, smoke-probe, security-scanner, performance-measure]
layer: system
---

A preview environment is a running copy of the change, deployed for each pull request at its own address. The checks
that need the app to run (browser flows, audits, scans, smoke probes) are pointed at it.

## Finding it

The project's CI or deployment configuration creates it: a deploy job for each pull request, or a hosting platform
connected to the repository. Its address is posted on the pull request, as a comment or a deployment, and the code
host's command-line client or API reads it from there.

## Using it

- **Wait until it is ready**: the deployment has succeeded and the app answers before any check starts.
- **Check that it runs the commit under test**, not an earlier push: read the version from the deployment or from an
  endpoint the app serves.
- **Test data only**: no copy of production data and no real users' accounts.
- **Torn down after merge or close**, so old previews neither pile up nor answer for a change that is gone.

Examples: GitLab review apps, Vercel or Netlify previews, a namespace per pull request in Kubernetes.
