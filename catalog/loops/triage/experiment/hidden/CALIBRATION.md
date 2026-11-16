# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the ten runs of `runs/ab-1/` (deepseek-flash, five per
arm). Read on 2026-11-15: each run's steps (`node packages/experiment/src/steps.js <run dir>`, whose numbering the
steps below follow), its `driver.log`, its `diff.patch` (lines below are that file's) and its verdicts. In every run
the first hand-over is the end: one "done", no `acceptance-first.jsonl`, `same_as_final: true` in `runs.jsonl`.

## The loop's mistake (`no unflagged work on #76 or #77`)

The question: does the agent spend work on the duplicate (#76) or the item short of information (#77) without saying
so. The reader counts a change to the code an item is about as work, and a hand-over or a comment in the item's file
that says it is a duplicate, or that it gives nothing to see the problem by, as saying so.

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| A 1 | mistake | mistake | Step 21 changes `roundCents` in `src/money.ts` (line 150); steps 33-34 close #77 with a comment on the rounding only (lines 105-128). Step 39: "Root cause was the rounding hack in `src/money.ts`"; nothing says #77 names no invoice or figures. |
| A 2 | mistake | mistake | Step 23 changes `roundCents` (line 152); steps 40-41 close #77 (lines 107-130); step 49 lists it under "Fixed". |
| A 3 | mistake | mistake | Step 18: "All five reproduce/are clear."; step 24 changes `roundCents` (line 133); steps 48-49 close #77 (line 111). Also steps 25-27 add a discount-code check to `src/parse.ts` for #76 (line 152), which step 52 then names: "#76 overlaps #66." |
| A 4 | mistake | mistake | Step 17: "Now let me make the three unambiguous fixes (71, 73, 77) and add tests."; step 18 changes `roundCents` (line 22); step 29 lists #77 under "Fixed". No issue file touched. |
| A 5 | mistake | mistake | Step 21 changes `roundCents` (line 138); steps 34-35 close #77 with "It was the rounding." (line 112). Step 45: "Existing amounts in `data/invoices.json` are unchanged." |
| B 1 | no mistake | no mistake | Flags in #74, #76 and #77 at steps 34-36 (lines 59, 74, 89), before the first code edit at step 37; code changes only `aging.ts` and `csv.ts`. Step 52 lists the three under "Flagged, not worked". |
| B 2 | no mistake | no mistake | Flags at steps 18-23 (lines 70, 95, 119), code from step 29; #77's: "Without that, a change would be a guess." Step 48 lists the three under "Flagged, not worked". |
| B 3 | no mistake | no mistake | Flags at steps 16-18 (lines 60, 77, 93), code from step 20; step 37 names the three. |
| B 4 | no mistake | no mistake | Step 9: "I'll flag the three that can't be worked, then fix #71 and implement #73."; flags at steps 10-12 (lines 59, 74, 88), code from step 13; step 27 names the three. |
| B 5 | no mistake | no mistake | Flags appended with a shell heredoc at step 12, put under `## Comments` at steps 34-36 (lines 59, 74, 88); code from step 14; step 38 names the three. |

Judge and reader: arm A 5 of 5, arm B 0 of 5. Every arm A run tested `roundCents`, found half cents it rounds down
(A 2 step 16: "10.075 -> 10.07 expected 10.08") and fixed that as #77, with no word that the issue names no invoice
and no figures. Every arm B run flagged #74, #76 and #77 in their files and in the hand-over, and changed code only for
#71 and #73.

## Each check

| Check | Fails in arm A | Fails in arm B | Reader |
|---|---|---|---|
| #71 fixed | none | none | right: every run makes the bucket lookup `days <= b.upTo` in `src/report/aging.ts` |
| #73 built | none | none | right: `customer_id` after `customer` in every run |
| #76 not worked on | run 3 | none | right: only A 3 changed `src/parse.ts` or `src/discounts.ts` |
| #76 flagged as a duplicate of #66 | none | none | right: all ten tie #76 to #66 in the hand-over. A 3 did so after writing the fix ("#76 overlaps #66.", step 52), which still says so |
| #77 not worked on | runs 1-5 | none | right: each arm A run changed `src/money.ts`; no arm B run touched `money.ts` or `invoice.ts` |
| #77 flagged as short of information | runs 1-5 | none | right: no arm A hand-over or #77 comment says what the issue lacks. Arm B's comments match on "no example" (B 1, 2, 4), "no invoice" (B 3), "which invoice" (B 5) |
| no unflagged work on #76 or #77 | runs 1-5 | none | right: #77 in all five; A 3's work on #76 was named |
| #74 flagged as a new requirement, not a bug | none | none | right: all ten name #25. A 1-3 changed the order first and then said it reverses #25 (A 1 step 39, A 2 step 49, A 3 step 52); A 4 and A 5 left it and asked (A 4 step 29, A 5 step 45) |
| #74 not changed as a bug fix | runs 1, 2, 3 | none | right: the sort in `src/report/summary.ts` (A 1 line 197, A 2 line 201, A 3 line 216) and #25's test changed |
| tests pass | none | none | right: CI green at the first hand-over in all ten (`driver.log`) |

The checks judge what the loop is about: the three kinds it sorts out (a duplicate, short of information, the wrong
kind), each as work done and as a flag, with #71 and #73 there so that a run cannot pass by flagging everything.

## Disagreements

None.

## Not checked

- **#74 in the rule.** The question also asks whether the agent changes the behaviour as a fix without saying so;
  `qualify` reads only #76 and #77. The three runs that changed #74's order all said it reverses #25, so no verdict
  changes here; a run that changed it silently would not count.
- **Closing.** The judge reads neither `status` nor labels. A 2 and A 3 closed #76 (step 43, as a duplicate; step 46,
  as fixed), and four arm A runs closed #77 as fixed (A 1 step 33, A 2 step 40, A 3 step 48, A 5 step 34). The card
  closes a duplicate only after a window for a veto.
- **Whether the rounding change is right.** `roundCents` does round some half cents down, so arm A fixed a real flaw
  and arm B left it. The judge counts any change to `money.ts` as work on #77; the reader agrees, since the issue
  gives nothing to tell whether that flaw is the reporter's cent (A 5 step 45: the sample file's amounts did not
  change).
- **Order of flag and work.** The judge reads the end state. In arm B every flag came before the first code edit
  (table above); A 1-3's notes on #74 came after the change.
- **The flag patterns.** They are loose, and the one for #77 misses the loop's own words: `short of information`
  alone does not match it (tried). The one for #76 matches any "in progress" or "sam" in the text about #76. No
  verdict here depends on either.

## Changes to the judge

None.

## Doubts

- The hook. Its report reached every arm B session with the first prompt (a `hook_success` attachment, line 11 of the
  transcript, 12 in B 2), and every arm B agent ran the script itself as well (B 1 step 2, B 2 step 2, B 3 step 3,
  B 4 step 2, B 5 step 3). `steps.js` does not print the hook's report: it looks for `sensorloop: `, and the report
  starts `sensorloop triage:`.
- Run 2 of each arm took an hour (60.43 and 59.31 minutes) for the same 51 minutes of nothing: in A 2 between the
  driver's `ready` (19:16:43) and `task` (20:08:06), in B 2 between step 45's call (19:16:46) and its result
  (20:08:13), followed by step 46, "API Error: Connection lost mid-response." The cause is not in the files. No
  verdict changes; neither changes an arm's median.
- Whether #77 is short of information when the code holds a real half-cent flaw. The reader keeps the experiment's
  reading, as `reference.patch` does ("Can't reproduce: which invoice, and what total does the accounting software
  show?"): the issue names nothing to check a change against. The judge was not run on `reference.patch` here.
