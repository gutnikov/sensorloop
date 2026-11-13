---
title: Dependency scanner
summary: Lists the project's dependencies and checks each against vulnerability databases and the allowed licences.
sensors: [security-scanner]
layer: project
---

A dependency scanner reads the project's lockfiles, or a built image, and checks every package against vulnerability
databases and the licences the project allows. The ecosystem decides which lockfiles it reads; the scanner already in
use is found in the project first.

## Finding it

1. **CI**: the job that runs the scanner, or the code host's dependency alerts.
2. **The lockfiles**: `package-lock.json`, `poetry.lock`, `go.sum`, `Cargo.lock`, and the image a release ships.
3. **Its policy files**: an ignore file (`.trivyignore`, `osv-scanner.toml`), and the list of allowed licences.

When these disagree, CI wins.

## Using it

- **Scan the repository**: for example `trivy fs .`, `npm audit` or `pip-audit`.
- **Give it network access** to the databases: a scan that could not update them has checked nothing new.
- **Every ignore entry carries a reason and an expiry date**, so an accepted risk is looked at again.
- **Write the list as an SBOM** (CycloneDX or SPDX) when a release needs it: `trivy fs --format cyclonedx .`.

Examples: Trivy, OSV-Scanner, `npm audit` (JavaScript), `pip-audit` (Python), `govulncheck` (Go); the list as an SBOM
in CycloneDX or SPDX.
