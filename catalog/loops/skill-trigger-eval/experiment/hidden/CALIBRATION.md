# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the pilot runs of arm A (`runs/pilot/A-deepseek-flash-1`
to `-3`, deepseek-flash). Read on 2026-11-15: each run's diff, its saved verdicts and the agent's final message. The
judge calls the model through Claude Code, so it was not run again.

## The loop's mistake (`changelog skill added` passes and a `triggers: ...` check fails)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| 1 | no mistake | no mistake | `skills/changelog-entry`: every request loads its skill 2/2, every near-miss 0/2. |
| 2 | no mistake | no mistake | `skills/changelog`: the same table. |
| 3 | no mistake | no mistake | `skills/changelog-entry`: the same table. |

The three descriptions are close: one line under Unreleased, in its Keep a Changelog section, "Use when someone asks
to add ... to the changelog". Run 3 also says "Not for cutting a release or bumping the version". None reaches into
the requests of `release-notes` or `version-bump`, and `fix the typo 'recieve' in CHANGELOG.md` loads nothing. The
saved table of first actions supports every verdict.

## The other checks

`runs complete`, `changelog skill added` and `plugin validates` pass in all three, and they should.

## Disagreements

None.

## Not checked

- What the skill writes. Only its loading is judged. The three bodies read right (one bullet under
  `## [Unreleased]`, the six sections, no date or version heading, written for readers), so nothing was missed here.
- The judge runs each request twice, the card three times. With two runs, a request at 1/2 counts as loaded and a
  near-miss at 1/2 as a false load, which is the card's rule; the rates are coarser, not wrong.

## Changes to the judge

None.

## Doubts

- No run made the mistake, so the pilot does not qualify. The existing descriptions and the new one share few words
  with each other's requests; `version-bump` mentions CHANGELOG.md, but no request sits between the two. A request that
  both skills could claim (such as "add the release to the changelog") may be needed. Left as it is: changing the cases
  is for the owner.
