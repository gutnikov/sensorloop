---
title: Dependency scanner
summary: Lists the project's dependencies and checks each against vulnerability databases and the allowed licences.
sensors: [security-scanner]
layer: project
---

A dependency scanner reads the project's lockfiles, or a built image, and checks every package against vulnerability
databases and the licences the project allows. The ecosystem decides which lockfiles it reads. Look for the scanner the
project already runs before adding one.

## Finding it

1. **CI**: the job that runs the scanner, or the code host's dependency alerts.
2. **The lockfiles**: `package-lock.json`, `poetry.lock`, `go.sum`, `Cargo.lock`, and the image a release ships.
3. **Its policy files**: an ignore file (`.trivyignore`, `osv-scanner.toml`), and the list of allowed licences.

When these disagree, CI wins. When none of them shows a scanner, ask a person before adding one.

## Using it

- **Scan, and fail on findings**: for example `npm audit`, `pip-audit` or `trivy fs --exit-code 1 .`. Trivy exits with
  success even when it finds something, unless `--exit-code` says otherwise. The lowest severity that fails is the
  project's choice, set in CI (`--audit-level` in npm audit, `--severity` in Trivy).
- **Give it network access** to the databases: a scan that could not reach them has not checked the dependencies, and
  its silence is not a pass.
- **Upgrade to the fixed version** the finding names. Ignore a finding only when no fix exists or it does not apply,
  and give every ignore entry a reason and an expiry date, so an accepted risk is looked at again.
- **Write the list as an SBOM**, a software bill of materials, when a release needs it: `trivy fs --format cyclonedx .`.

Examples: Trivy, OSV-Scanner, `npm audit` (JavaScript), `pip-audit` (Python), `govulncheck` (Go); the list as an SBOM
in CycloneDX or SPDX.
