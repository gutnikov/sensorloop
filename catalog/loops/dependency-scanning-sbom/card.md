---
title: No known-vulnerable dependencies
summary: A scanner checks the project's dependencies against vulnerability databases, and the agent moves each vulnerable package to a safe version before the change is merged.
sensors: [security-scanner]
when: On every pull request that changes a manifest or a lockfile, and every night over the SBOMs of the releases in production.
failure: A dependency with a known HIGH or CRITICAL vulnerability, fixed or not, that no current exception covers; a version on the project's ban list; and a scan that failed or found no packages.
next: The agent moves the package to a safe version, or replaces it, and scans again. A risk is accepted only by a person, who approves the exception the agent proposes. A new finding in a shipped release becomes maintenance work, not a red pull request.
---

## The loop

1. A CI job writes the SBOM, the list of every component and version, from the project's lockfiles, and scans it
   against vulnerability databases.
2. For each blocking finding, the agent picks a safe version: the lowest one that fixes every blocking vulnerability
   of the package, and that the build and the tests accept.
3. For a transitive dependency, it first updates the direct dependency that pulls it in. It pins the transitive
   version (an override in the package manager) only when no such update exists.
4. With no fixed version, it replaces the package, or proposes an exception to a person.
5. The scan runs again. The loop ends when it is clean.
6. The release keeps its SBOM. Every night a job scans the SBOMs of the versions in production; a new finding there
   is maintenance work to triage, not a red pull request.

## Why

A dependency the agent adds brings code nobody in the project wrote, and its known vulnerabilities do not show in
the diff. The scan catches a published vulnerability while the change is still open. The SBOM lets the same scan run
again later, when a vulnerability is published for something already shipped.

## Set up

- **A scanner that fails on a finding.** With Trivy, `trivy fs --format cyclonedx --output sbom.cdx.json .` writes
  the SBOM, and `trivy sbom --exit-code 1 --severity HIGH,CRITICAL sbom.cdx.json` scans it. Trivy exits 0 on
  findings unless `--exit-code` is set. OSV-Scanner exits 1 when it finds a vulnerability.
- **A scan that saw nothing is not a pass.** The job fails when the scanner errors or finds no packages; OSV-Scanner
  reports these with exit codes 127 and 128.
- **Block on HIGH and CRITICAL, report the rest.** Lower severities on every pull request make a noise the agent
  learns to step around. The project can choose another level.
- **Unfixed vulnerabilities stay in the gate.** An option such as `--ignore-unfixed` hides exactly the findings where
  the package has to be replaced or a person has to accept the risk.
- **Exceptions expire and name what they excuse.** Each entry in the ignore file names the advisory and the package,
  says why it does not apply, and carries an expiry date after which it fires again. An entry that matches nothing is
  reported for removal.
- **Limit what a change can bring in.** Direct dependencies are pinned to exact versions; install scripts run only
  from an allowlist; every lockfile entry has its source and integrity hash; a binary that CI downloads is checked
  against a checksum kept in the repository.
- **A ban list for bugs with no advisory.** No scanner stops a version with a functional bug from coming back. Each
  banned range, with its incident and its fixed version, is checked over the lockfile on every pull request.
- **Out of the agent's reach.** The final run is in CI, and a hook refuses the agent's writes to the ignore file: the
  agent proposes an exception, and a person approves it.
