# Which Actual pull requests became experiments

The rule, fixed before any outcome was looked at: pull requests in actualbudget/actual with "[AI]" in the title,
created since 2026-07-01, with at least one review in the state CHANGES_REQUESTED, walked from the most recent. A pull
request is taken when all four hold:

1. The review (or its comments) names a concrete problem a program can check.
2. A version fixes it: commits pushed after that review, the merged result, or a follow-up pull request.
3. The agent's version before the review can be recovered.
4. The change can be judged without external services.

The first five that pass are taken.

The search on 2026-11-15 (`repo:actualbudget/actual is:pr "[AI]" in:title review:changes_requested
created:>2026-07-01`) returned 61 pull requests. 17 were looked at, in order; 5 taken, 12 skipped.

How two of the conditions were read, decided at the third candidate and applied to every one:

- **A program can check it** means on the work of another agent given the same request, through code or behaviour
  that exists before the change or that the request names. A problem that lives only in this implementation's own new
  design (a page, cookie or module it invented) cannot be checked on another agent's work, so condition 1 fails.
- **The review** is any review in the state CHANGES_REQUESTED, whoever wrote it. In 16 of the 17 every such review is
  CodeRabbit's (the bot), and so in all five taken; the author accepted the finding and pushed a fix in each. Only
  #9240 also has a maintainer's (MikesGlitch).

| # | Pull request | Created | Decision | Why |
|---|---|---|---|---|
| 1 | #9558 [WIP] [AI] Don't budget a skipped schedule occurrence in the current month | 2026-11-15 | **taken** | CodeRabbit on 2ff55276: a skipped bill is budgeted again once its due date has passed (skip on Nov 5, forecast on Nov 12). Fixed in 7f09eea0 with a regression test. Pre-review 2ff55276 recoverable. loot-core only. |
| 2 | #9544 [AI] Tag new bank sync transactions for review (experimental) | 2026-11-13 | skipped | 2: no fix. The review is on the head, f8f015d0; nothing was pushed after it. |
| 3 | #9543 [WIP] [AI] feat: add OAuth 2.0 application authorization | 2026-11-13 | skipped | 1: the findings (a consent page that can be framed, one nonce cookie shared by two pending logins, an expired consent session) live in pages and cookies of this implementation's own design; another agent's OAuth server has none of them to check. |
| 4 | #9477 [WIP] [AI] Declare location permissions in the iOS and Android apps | 2026-11-08 | **taken** | CodeRabbit on 00552544 (Major): when the permission status cannot be queried, as in the apps' web views, `useLocationPermission` reports not granted and the screen hides Request Location, so the fix does not make the button work. Fixed by the commits up to 3ce2c874, with hook tests. Pre-review 00552544 recoverable. Checked with the hook in jsdom and the two manifests; no device. |
| 5 | #9424 [AI] Add automatic exchange rates from Frankfurter (do not merge: stacked on #9356) | 2026-11-03 | skipped | 1 and 4: the findings are in the stacked #9356's multi-currency code (a chart tooltip, a currency warning, `doTransfer`), not in what this pull request asks; its own feature fetches rates from an external service (Frankfurter). |
| 6 | #9422 [AI] fix(csv-import): parse scientific-notation and >9-decimal amounts | 2026-11-03 | **taken** | CodeRabbit on eed7bd98 (Major): `1,23e2` parses as 1 and `$1.23e2` as null, so CSV rows are dropped; on 9f1966ee: `1.234e2` gives 123400, `0.0000001e8` gives 1e-7. Fixed by 9622f77e. Pre-review eed7bd98 recoverable. A pure function in loot-core. (A third review, on 9622f77e, is not fixed and not used.) |
| 7 | #9407 [WIP] [AI] Apply schedule rule category when linking transactions manually | 2026-11-02 | skipped | 2: the one commit pushed after the review (f835f940) is the reviewed commit 6ca42700 rebased, patch for patch (`git range-diff`); the findings are not fixed. |
| 8 | #9389 [WIP] [AI] Don't flag transfers to off-budget accounts as uncategorized in tracking budgets | 2026-10-31 | skipped | 2: closed unmerged; the review is on the head and no follow-up pull request references it. |
| 9 | #9357 [AI] Keep custom report filters when the Budgeted type is selected | 2026-10-28 | **taken** | CodeRabbit on f3c161ef (Major): in Budgeted mode a category-group filter is still dropped from the query, so the report ignores it. Fixed in de9a9160. Pre-review f3c161ef recoverable. Judged in the running web app (a browser), no external service. |
| 10 | #9342 [AI] [PoC] Standardize custom-sized buttons into generic types | 2026-10-27 | skipped | 2: after the review (on f43e0a62) only a merge of master was pushed. |
| 11 | #9340 [AI] Currency Decimal Precision (Full Change Stack) | 2026-10-26 | skipped | 1: a stack of 38 commits; the findings (a precision gate on settings routes, a per-file lock in the sync server, release-note categories) are in its own new design, not checkable on another implementation of "decimal precision per currency". |
| 12 | #9338 [AI] Run the sync-server Docker image as a non-root user | 2026-10-26 | skipped | 4: the findings (a root-only folder under a writable `/data`, symlinked data folders, paths from `config.json`) show only when the image's entrypoint runs as root over files of other owners; judging needs a Docker daemon and root, which the judge (user `node` in the container) does not have. |
| 13 | #9319 [AI] Add multi-currency support (do not merge: CI and CodeRabbit test) | 2026-10-25 | skipped | 1: a test pull request of an eight-phase stack; the findings are in its own new modules (`fx/import.ts`, the `accounts-set-currency` handler); closed unmerged. |
| 14 | #9279 [AI] Add overspending alerts to the budget page | 2026-10-19 | skipped | 2: closed unmerged; after the review only screenshot updates were pushed. |
| 15 | #9262 [AI] Add German bank sync via FinTS api | 2026-10-18 | skipped | 4: bank sync against real German banks (FinTS); one finding is a licence question, not a program's. |
| 16 | #9240 [AI] Fix export writing whole 64 KiB buffer pool slab | 2026-10-16 | skipped | 1: the maintainer's first review asks for a plainer release note; the second only says "address the coderabbit comments" (a separate review); CodeRabbit's own review on b42dca4e is not fixed (closed unmerged). |
| 17 | #9225 [AI] Clamp monthly schedule day-of-month to the last day of short months | 2026-10-15 | **taken** | Of its six reviews, the first that passes is CodeRabbit on d6c35ec8: a February occurrence that a 10-month interval reaches is left out (start 2026-04-30, day 30), and 2028-02-29 can come twice. Fixed in 3b578841 (and a85318f4). Pre-review d6c35ec8 recoverable. Earlier reviews: b6fcac78's finding was declined, not fixed (condition 2); a57b81eb's and bacd3dce's are about the picker's new hint and its own e2e test (condition 1). |

The walk stopped at #9225, the fifth taken. Not looked at: the 44 older candidates, from #9223 on.

## The experiments

One per taken pull request, in `catalog/loops/<loop>/experiments/actual-<number>/`; why each maps to its loop is at the
top of its `experiment.yaml`. Every review that asked for the change is a fresh-context reviewer reading the diff
(CodeRabbit), so a Major finding maps to agent-code-review, whose failure is a confirmed high-severity finding; #9225's
finding was rated Minor, which that card leaves out of its loop, so it maps by its kind, a wrong value, to
agentic-manual-testing.

| Pull request | Loop | Experiment | State |
|---|---|---|---|
| #9558 | agent-code-review | `agent-code-review/experiments/actual-9558` | built; judge verified on mistake.patch and reference.patch |
| #9477 | agent-code-review | `agent-code-review/experiments/actual-9477` | built; judge verified |
| #9422 | agent-code-review | `agent-code-review/experiments/actual-9422` | built; judge verified |
| #9357 | agent-code-review | not built | its finding (a category-group filter ignored in a Budgeted custom report) shows only in the running web app: the judge needs a browser driver, Chromium and the app's dev server in the 3 GB container. Not built in this round, rather than judged through a component test that would fix the agent's design. |
| #9225 | agentic-manual-testing | `agentic-manual-testing/experiments/actual-9225` | built; judge verified |

The four images share their first layers word for word (Node 24 as Actual's `.nvmrc` sets it, corepack, and one
dependency install at master 4ca5c891), so each adds only its checkout and a dependency delta.
