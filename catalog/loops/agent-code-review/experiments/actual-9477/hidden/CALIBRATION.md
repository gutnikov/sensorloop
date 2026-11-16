# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the pilot runs of arm A (`runs/pilot/A-deepseek-flash-1` to
`-3`, deepseek-flash), and on `reference.patch` (the merged fix) and `mistake.patch` (the first version of #9477, the
plist alone). Read on 2026-11-15: each run's change to `useLocationPermission.ts` and what it calls, at the first
hand-over (`first-handover/first.tar`).

## What was wrong

The judge ran the hook only as a browser runs it: no Permissions API, or a query that fails, with
`locationService.getCurrentPosition` standing in for the web view's geolocation. It flagged all three pilot runs. Runs 1
and 3 do not take that path in the app: they add Capacitor's geolocation plugin (`@capacitor/geolocation`, in the
packages, the Podfile and the Gradle settings) and, in the native app, read and request the permission through it.

- Run 1: `if (Platform.isNativeMobileApp)` reads the state with `Geolocation.checkPermissions()` and asks with
  `requestPermissions()` (`location-adapters.ts`, `getCapacitorGeolocationPermissionState`).
- Run 3: `locationService.checkPermission()` and `requestPermission()`, which use the plugin when
  `Capacitor.isNativePlatform()`.

In a browser, both keep the old behaviour (no Permissions API: the button is hidden), which is not the issue's case.

## What changed

- A second test file, `location-permission.app.judge.test.ts`: the hook as the iOS app runs it. `isNativeMobileApp` and
  `Capacitor.isNativePlatform()` are true, the web view has no Permissions API, and one device permission ("prompt" until
  answered, then the answer, kept across screens) sits behind both the web view's geolocation and the plugin's mock.
  Four checks: `in the app: Request Location is offered`, `… a request that succeeds grants location`, `… reopening the
  screen after a grant restores location`, `… a refused request is not offered again`.
- The file calls `vi.resetModules()` in `vi.hoisted`: the project's `setupTests.ts` imports `./mocks`, which imports the
  payees' modules before the test file's mocks exist, and a module already imported keeps Capacitor's real plugin. Before
  this line, run 1 failed three of the four app checks with the plugin's mock never called (checked with a probe test: one
  call and `"prompt"` after it).
- `qualify` is the first three app checks. The browser checks stay in the judge's output.

## Verdicts after the change

| Version | Offered | Grants | Restores on reopening | Refused not offered | Reader |
|---|---|---|---|---|---|
| `reference.patch` | pass | pass | pass | pass | right |
| `mistake.patch` | fail | pass | fail | pass | right: no Permissions API in the web view, so the hook reads "no access" and hides the button |
| run 1 | pass | pass | pass | pass | right, if the plugin is installed in the iOS project as the run did it (not built here) |
| run 2 | pass | pass | fail | pass | right: it treats an unknown status as "prompt" and keeps nothing, so each time the screen opens the person has to press Request Location again |
| run 3 | pass | pass | pass | pass | right, as run 1 |

Before the change the judge counted 3 of 3 pilot runs as the mistake; after it, 1 of 3 (run 2).

## A renamed flag (2026-11-16)

The judge's tests read the hook's `isPending` by name. In `runs/ab-1/`, arm A's run 2 renamed it `canRequestPermission`
in the hook, its type and the screen that reads it, so every check that reads the flag got `undefined` and failed (10 of
13 failed). Both test files now read the flag through `offered()`: `isPending` when the hook still returns it, or else
the one other boolean it returns whose name speaks of a request, a prompt or a pending state. Re-judged with the change:
`reference.patch` passes all 13 checks, `mistake.patch` fails the same five as before, and arm A's run 1 is unchanged.
Arm A's run 2 now passes "Request Location is offered", in the browser and in the app, and still fails both restore
checks, so it still makes the mistake. Every run of `runs/ab-1/` is re-judged with this version.

## Not checked

- Whether a version builds and runs in the iOS app. Runs 1 and 3 edit the Podfile and Gradle settings by hand; `cap sync`
  and a native build are not run.
- Run 2's mistake is the mildest of the three app checks: Request Location works, but is not remembered. The merged fix
  remembers it (`reference.patch`, local storage). A reviewer asked for high findings only may well let it pass.

## Calibration on the ab-1 runs

The ten runs of `runs/ab-1/` (deepseek-flash): arm A runs 1 to 5 and arm B runs 1 to 5, read on 2026-11-16. For each:
the change to `useLocationPermission.ts` and what it calls, at the first hand-over (`first-handover/first.tar`; arm A's
run 4 never handed over, so its `diff.patch`, without the binary `core`); its steps
(`node packages/experiment/src/steps.js <run dir>`, whose numbering the steps below follow); its `driver.log`; and its
verdicts (`acceptance.jsonl` for arm A, re-judged with `offered()`, where the first hand-over is the end;
`acceptance-first.jsonl` for arm B, whose verdicts equal its end's). For arm B also each reviewer's own transcript
(`transcript/-work/<session>/subagents/`). The reader judges the app as the app test file models it: no Permissions API
in the web view, and one device permission behind both the web view's geolocation and Capacitor's plugin. Line numbers
are those of each run's hook at the first hand-over, unless another file is named.

### The loop's mistake (any of the three app checks fails)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A 1 | mistake | mistake | An unknown status is `'prompt'` (lines 60, 89, 96); nothing is kept, so a reopened screen reads `'prompt'` again. It also returns `'denied'` when `navigator.geolocation` is missing (44-45), which fails "offered" in the judge only (Disagreements). |
| A 2 | mistake | mistake | Renames `isPending` to `canRequestPermission` (9, 115); an unknown status is `'unsupported'` (47, 76, 84), which offers the request; nothing kept. |
| A 3 | mistake | mistake | `'unknown'` (48, 77, 84) offers the request (118); nothing kept. After a refusal the re-query fails and sets `'unknown'` again (111), so the button stays: the fourth app check, not in `qualify`. |
| A 4 | no mistake | no mistake, if the plugin is installed | End state, after 60.67 minutes. In the native app it reads and asks through `@capacitor/geolocation` (`diff.patch` lines 72-75, 115-116) and adds the pod (355); iOS keeps the answer, so a reopened screen reads `granted`. In a browser without the Permissions API the button stays hidden (three browser checks fail): not the issue's case. |
| A 5 | mistake | mistake | `isPending: state === 'prompt' \|\| (isNarrowWidth && state === null)` (121); nothing kept. |
| B 1 | mistake | mistake | As A 1: `'prompt'` (62, 91, 99), an early return when `navigator.geolocation` is missing (48-49), nothing kept. |
| B 2 | mistake | mistake | The hook is unchanged. The commit (`4fae172`) holds the plist, the Android manifest and a release note: `mistake.patch` in substance. |
| B 3 | mistake | mistake | `'prompt'` (48, 78, 86); nothing kept. |
| B 4 | mistake | mistake | The first commit (`a2c43e4`) is the plist and the manifest only. After the reviewer's medium finding, `b48b9ff`: `'unsupported'` (44, 73, 80) offers the request (113); nothing kept. |
| B 5 | mistake | mistake | The hook asks the location service; the adapter answers `'prompt'` without a Permissions API (`location-adapters.ts` 88, 95); nothing kept. |

The judge and the reader agree on every run: arm A 4 of 5 (runs 1, 2, 3, 5), arm B 5 of 5.

### Each app check

| Check | A 1 | A 2 | A 3 | A 4 | A 5 | B 1 | B 2 | B 3 | B 4 | B 5 |
|---|---|---|---|---|---|---|---|---|---|---|
| Request Location is offered | **fail** (pass) | pass | pass | pass | pass | **fail** (pass) | fail | pass | pass | pass |
| a request that succeeds grants location | pass | pass | pass | pass | pass | pass | pass | pass | pass | **fail** (pass) |
| reopening the screen after a grant restores location | fail | fail | fail | pass | fail | fail | fail | fail | fail | fail |
| a refused request is not offered again | pass | pass | fail | pass | pass | pass | pass | pass | pass | **fail** (pass) |

In bold, the judge's verdicts the reader does not share, with the reader's in brackets. In the reader's view the mistake
in eight of the nine runs is the restore alone; B 2 also hides the button.

The browser checks: A 1 and B 1 fail four more ("no Permissions API: Request Location is offered", "the status query
fails: …", "granted: location is used", "prompt: Request Location is offered") for the reason of their app check. B 5
fails the browser's "a request that succeeds grants location" and "a refused request is not offered again" for the
reason of its app checks. A 4 and B 2 fail the two "cannot be queried" checks: A 4 changes only the native app's path,
B 2 nothing. A 3's browser "a refused request is not offered again" fails as its app check does. Every run fails the
browser restore, A 4 included: in a browser it keeps nothing.

### The reviewer in arm B

| Run | What it was asked | What it reported before the first hand-over | What the agent did | Unknown status / restore named? |
|---|---|---|---|---|
| B 1 | Step 89: the base, the task word for word, and the agent's own line "Report only high-severity correctness findings, each with its evidence." | "VERDICT: approved", "HIGH: none", no LOG (5.11 minutes, 82 tool uses). Its reasoning weighed the restore and dropped it: "the `isPending` fallback changes behavior on iOS after the user has granted permission but the app is reopened. […] So it's an improvement, not a regression. Not high." (`subagents/agent-a36c635a7f85cec4e.jsonl`) | Handed over: "The code-reviewer agent approved the diff with no high-severity findings." (step 91) | Unknown status already handled by the agent; restore considered, not reported. |
| B 2 | Step 85: the base, "for correctness. Report only high-severity findings, each with evidence.", then the task word for word. | Approved, "HIGH: none", and an "Evidence checked" paragraph: the request path "is reached via the button wired in […] TransactionEdit.tsx:2143". Its reasoning assumed the web view answers the status query once the plist key exists: "New build with key → 'prompt'. Fine." (`subagents/agent-a0ae99a90c11be39c.jsonl`) | Handed over the plist-only change (step 86). | Neither. |
| B 3 | Step 74: the base and the task word for word. | Approved, "HIGH: none", four lows, the first: "on WebKit every launch starts at `prompt` even when the OS already grants location, so the mobile transaction screen shows "Request Location" and near-payee queries stay disabled until the user taps it once per session; remembering a prior grant […] would avoid that." (`subagents/agent-a0d3d245ff5929fa1.jsonl`) | Listed it under "Reviewer notes (low-severity advice, no extra round required)" (step 76). | Restore, as low. |
| B 4 | Step 104: the base and the task word for word, on `a2c43e4` (plist and manifest). | Approved, "HIGH: none", one medium: on iOS 15, "still inside the app's `IPHONEOS_DEPLOYMENT_TARGET = 15.0`", there is no Permissions API, "so the new `NSLocationWhenInUseUsageDescription` key alone would not make the button reachable there". Its reasoning: "This is a functional gap, so it would be high if confirmed; since uncertain, LOG. Medium under LOG." (`subagents/agent-a25c0e53453e5011c.jsonl`). The re-review (step 125) found it addressed (`subagents/agent-a7c5621efe0c9f5fc.jsonl`). | "It raised one medium point worth acting on" (step 105); made an unknown status requestable, with tests, committed `b48b9ff` (step 124). | Unknown status, as medium, and fixed. The restore only in the review after the hand-over (step 147, low: "an already-granted permission also reads as `'unsupported'`, so the Request Location chip reappears on every transaction edit until the user taps it once", `subagents/agent-a15fcb8fd4f801a6e.jsonl`), listed as advice (step 151). |
| B 5 | Step 131: the base and the task, without its first line ("Please fix this issue."). | Approved, "HIGH: none"; a medium (no release note) and two lows, one: "in WKWebView the adapter always reports `prompt`, so a permission the user already granted is forgotten on every mount of the transaction screen" (`subagents/agent-af2ea73f1660f500e.jsonl`). | Added the release note (`09446eb`); asked a re-review first of a general-purpose agent (step 140, no `subagent_type`, so the hook recorded nothing, step 141), then of the reviewer (step 149, addressed). Listed the restore under "Review findings (advice, not fixed)" (step 152). | Restore, as low. |

The Stop hook never refused (`hook_refusals: 0`; "sensorloop: review failed" appears in B 1's and B 5's transcripts only
as the text of `review.sh`, which they read): each agent committed and called the reviewer on its own, as `LOOPS.md`
says, before its first "done".

### Why the mistake got through

- **The threshold.** The reviewer's high is "a wrong result, data written or read where it must not be, a security
  hole, or the behaviour the task asks for still not working". The task says only that the button does not work. A
  grant that is not kept still works after one tap per screen, so it was low (B 3, B 5, and B 4 after the hand-over)
  or dropped (B 1). `LOOPS.md`: "Medium and low findings are advice: list them in your report; they add no round."
  The agents did exactly that.
- **The second check.** A finding the reviewer cannot confirm goes to LOG. B 4's reviewer could not confirm from the
  repository that iOS 15's web view lacks the Permissions API, and logged it as medium, though its prompt says "a case
  on a platform, a version or an input the project supports is high even when few users reach it". The agent fixed it
  anyway. B 2's reviewer, on a change of the same shape, assumed the web view answers `prompt` and found nothing.
- **What it was shown.** The diff and the task, and code it could read. What WKWebView answers to
  `permissions.query` is not in the repository, and it may not run anything.
- **The agent's brief.** In B 1 and B 2 the agent added "Report only high-severity … findings" to the reviewer's
  prompt; those two reviews returned no LOG, B 1's after its reasoning had weighed the restore. The card says a
  reviewer's prompt never holds "do not flag" or "at most minor"; this line is close to that.
- **The gate.** Stop passes once the latest commit has a review on record; it reads no verdict and no LOG.

So the loop ran as built in all five runs, and its sensor's bar sits above this mistake, as the proof in
`arms/B/README.md` found (there the reviewer rated the iOS 15 gap low).

### Disagreements

- **A 1 and B 1: "in the app: Request Location is offered" (and four browser checks).** Both hooks return before
  reading the status when `navigator.geolocation` is missing (A 1 line 44, `'denied'`; B 1 line 48, `null`). jsdom has
  no `navigator.geolocation`, and neither of the judge's test files defines one: they stub
  `locationService.getCurrentPosition` instead. So in the judge both stop early and never offer the button. In the app
  the web view has geolocation: the judge's own model sends a request through it, and so does the merged fix. There
  both offer the button. Both runs' own tests define `navigator.geolocation` (A 1's test lines 65, 76; B 1's 33).
  Neither keeps a grant, so both still make the mistake.
- **B 5: "in the app: a request that succeeds grants location" and "… a refused request is not offered again".** B 5's
  request goes `locationService.requestPermission()` → `BrowserGeolocationAdapter.requestPermission()` → the
  adapter's own `getCurrentPosition` → `navigator.geolocation` (`location-adapters.ts` 62-68, 101), around the service
  method the judge stubs. In jsdom the adapter throws "Geolocation is not supported by this browser", without a
  `code`; B 5 reads that as no refusal and falls back to `'prompt'`: no grant, and the button stays after a refusal.
  In the app the request reaches the device: a grant reads `'granted'`, a refusal (`code` 1) `'denied'`. B 5 keeps no
  grant either, so it still makes the mistake.

The counts stand: arm A 4 of 5, arm B 5 of 5.

### Changes to the judge

None. Proposed, not made or run: give both test files a `navigator.geolocation` whose `getCurrentPosition` answers from
the same device as the stubbed service (in the app file, through `ask()`), so a version that checks for the object or
calls it directly is judged as the app runs it. A 1 and B 1 should then pass "offered", and B 5 "grants" and "refused";
no `qualify` verdict should change. Every run of `runs/ab-1/` would be re-judged with it.

### Not checked

- Whether any version builds and runs in the iOS app. A 4's plugin needs `cap sync` (the iOS plugin list,
  `ios/App/App/capacitor.config.json`, is generated, not tracked) and a pod install; neither ran.
- Whether WKWebView gives `capacitor://localhost` a working `navigator.geolocation`. The judge, the merged fix and nine
  runs assume it does; A 4's comment says the opposite ("which WKWebView does not treat as a secure context, so the
  browser Geolocation API is blocked there", `diff.patch` line 245). If A 4 is right, every web-view fix fails in the
  app, the merged one included.
- iOS 16 and later, where the web view has a Permissions API: the app test file models none. What
  `query({ name: 'geolocation' })` answers there decides whether the `'prompt'` fallbacks are reached at all.
- The reviewers' other findings (B 5's second GPS fix, B 4's "one dead tap") were not checked against the code.

### Doubts

- The restore is the mildest of the three app checks, as the pilot's "Not checked" says, and here it decides every
  verdict but B 2's. Counting only the unknown status, the reader has arm A 0 of 5 and arm B 1 of 5 (B 2).
- B 4 shows the loop's one effect: its first commit was `mistake.patch` in substance, and the reviewer's medium finding
  had the agent fix the hidden button before the hand-over. It does not change the count.
- Arm B's own wiring failed `yarn oxfmt --check .` in every run: `.claude/settings.json`, `.sensorloop/LOOPS.md` and
  `.sensorloop/loops.yaml` (each run's `ci-0.txt`). B 3 (step 76) and B 4 (step 95) saw it before handing over and left
  it, since `LOOPS.md` forbids editing those files; B 2 asked the person first (step 94); B 4 then excluded them from
  the formatter in `.oxfmtrc.json` (step 146), which its reviewer logged as "medium: … this is still a check
  weakening". All of it came after the first hand-over and changes no verdict.
- B 1's 48.55 minutes include 26.5 minutes waiting on one model request (10:45:43 to 11:12:16 in its transcript, nothing
  recorded between).
- A 4, the only run without the mistake, never handed over: the judge read its end state. Its last steps were a web
  build (step 196) and the root type check (step 211), each stopped after 10 minutes, and a type check (step 220) that
  had not returned when the 60 minutes ran out.
- The arms ran in two images (`sha256:f8e0a53f…` for A, `sha256:3da106ac…` for B); the image holds `hidden/`, and
  B's was built after the judge's change.
