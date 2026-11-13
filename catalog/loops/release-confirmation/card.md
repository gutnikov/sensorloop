---
title: Confirm the release in production
summary: After a release reaches production, a job judges a window of real traffic, and the change is confirmed only if production runs it, its own signal appeared often enough, and nothing is worse than under the previous version.
sensors: [logs, metrics, error-tracker]
placement: outer
when: After each deploy to production, once a window of real traffic has passed (at least a set time and a set number of events on the changed path, up to a cap).
failure: Any verdict but confirmed. The new version is not the one running, the change's signal is missing or too rare, something is worse than under the previous version, or the window ended with too few events to judge.
next: The agent reads the snapshot of a window that did not confirm, names the check that failed, the errors or missing events that show it and the likely cause, and fixes the change, which is judged again after its next release. Rolling back belongs to the pipeline or the canary tool, never to the agent. An inconclusive verdict is reported to a person, not read as a pass.
---

## The loop

1. The release reaches production, and a job waits for the window.
2. It saves a snapshot: which version ran and, for the new version and the previous one over comparable windows, the
   errors, the event counts and the metrics.
3. It judges the snapshot with three checks, all of which must hold:
   - **The change is there.** The new version runs; behind a flag, the flag is on for its audience.
   - **Its signal appeared.** For a feature, the event its spec names appeared at least N times. For a fix, the signal
     that showed the problem stayed absent while the path where it showed ran at least N times. For maintenance, the
     product's own events stayed at the previous version's level, and the measure the change named improved.
   - **Nothing broke.** No new errors, and the error rate and latency are no worse than the previous version's.
4. It gives one verdict:
   - **confirmed**: all three checks hold;
   - **not the running version**: production does not run the change yet;
   - **signal missing**: the signal appeared too rarely, with its count (`3 of 50`);
   - **worse**: a new error with its count, or a rate above the previous version's (`error rate 2.1% vs 0.4%`);
   - **inconclusive**: the window reached its cap with too few events to judge.
5. On anything but confirmed, the agent reads the snapshot and finds which check failed, the errors or missing events
   that show it, and the likely cause. Its reading never changes the verdict.

## Why

Passing every check before the release shows that a change is ready to release, not that it works where it is used.
Quiet logs after a deploy prove little: a feature behind a flag that is off, or a path nobody takes, leaves them quiet
too. So the work ends not at the deploy, but when production runs the change, its signal shows, and nothing got worse.

## Set up

- **The version on every log line and every error**, with release markers in the error tracker. Without it, nothing
  can be attributed to the release.
- **Each change names its signal before the work starts**: the event in a feature's spec, the reproduction's signal
  for a fix, the measure for maintenance. For an error fixed from the error tracker, the signal is its issue there.
- **A window counted in events**: at least T minutes and N events on the changed path, up to a cap. A nightly job's
  window is its next run; a mobile release's is the sessions on the new version over days.
- **Compared with the previous version, not with zero.** Production always has background errors.
- **A weak baseline is said out loud.** Right after a rollback, the previous version may have served only a few
  requests. With fewer than half the window's events to compare with, the check falls back to an absolute limit on the
  error rate (1%, say), skips latency, and says that the baseline is weak.
- **Wait in the job, judge the snapshot.** The judgement reads only the saved snapshot, so it is fast and gives the
  same verdict every time.
- **Wiring.** A job in the deploy pipeline, or on a schedule where deploys are manual. A canary tool compares the new
  version with the previous one by itself; this loop adds the check that the change happened.
- **Out of the agent's reach.** The job runs in the pipeline or on a schedule, not in the agent's session, and the
  agent reads its verdict. Rolling back belongs to the pipeline or the canary tool.
