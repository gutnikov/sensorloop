---
title: Dynamic security scanner
summary: Probes a running copy of the app from outside, and reports the addresses that respond unsafely.
sensors: [security-scanner]
layer: system
---

A dynamic security scanner attacks a running copy of the app from outside, as a client would, whatever the app is
built with. It runs as a container or a service, and is aimed only at an environment the project owns.

## Finding it

- **CI**: a job that scans the preview or staging after it is deployed, and the rules file it reads.
- **The target**: the address of the preview or staging, from the deployment config or the pull request.
- **Credentials**: a test account for the parts behind a login, kept in the CI system's secrets.

## Using it

- **A baseline scan on each change**: it crawls and only watches the responses, in minutes
  (`zap-baseline.py -t <url>` in ZAP's container).
- **A full, active scan on a schedule**: it sends attacks, takes long and writes data.
- **An API scan from the OpenAPI description** (`zap-api-scan.py`) reaches endpoints no crawler finds.
- **Only against a preview or staging with test data**, never production. The rules file sets which alerts fail,
  warn or are ignored, each with a reason.

Examples: ZAP (formerly OWASP ZAP), Nuclei.
