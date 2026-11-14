---
title: No known-vulnerable dependencies
summary: A scanner checks the project's dependencies against vulnerability databases, and the agent moves each vulnerable package to a safe version before the change is merged.
sensors: [security-scanner]
when: On every pull request that changes a manifest or a lockfile, and every night over the SBOMs of the releases in production.
failure: A known HIGH or CRITICAL vulnerability in a dependency that no current exception covers, whether or not a fixed version exists. A version on the project's ban list. A scan that failed or found no packages.
next: The agent moves the package to a safe version, or replaces it, and scans again. When neither works, it proposes an exception, and only a person accepts the risk by approving it. The agent fixes a scan that failed or found no packages when the cause is in the project, such as a lockfile it broke, and otherwise hands a person the scanner's output. A new finding in a shipped release opens an issue for a person to triage; it does not turn a pull request red.
---

## The loop

1. A CI job writes the SBOM, the list of every component and version, from the project's lockfiles, and scans it
   against vulnerability databases.
2. For each blocking finding, the agent picks a safe version: the lowest one that fixes every blocking vulnerability
   of the package, and that the build and the tests accept.
3. For a transitive dependency, the agent first updates the direct dependency that pulls it in. It pins the
   transitive version (an override in the package manager) only when no such update exists.
4. When no version is safe, it replaces the package, or proposes an exception for a person to approve.
5. The scan runs again. The loop ends when it is clean. The agent stops earlier when what is left needs a person: an
   exception to approve, or a scan that fails for a cause outside the project.
6. Each release keeps its SBOM beside its artifacts. Every night a job scans the SBOMs of the releases in production;
   a new finding there opens an issue for a person to triage, and does not turn a pull request red.

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
- **Limit what a change can bring in.** Direct dependencies are pinned to exact versions. Install scripts run only
  from an allowlist. Every lockfile entry has its source and integrity hash. A binary that CI downloads is checked
  against a checksum kept in the repository.
- **A ban list for bugs with no advisory.** No scanner stops a version with a functional bug from coming back. Each
  banned range, with its incident and its fixed version, is checked over the lockfile on every pull request.
- **Out of the agent's reach.** The final run is in CI, and a hook refuses the agent's writes to the ignore file: the
  agent proposes an exception, and a person approves it.
