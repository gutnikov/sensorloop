In all 10 runs the agent fixed the aging buckets for #71 and added the `customer_id` column for #73, with tests, and
CI was green at its first hand-over. The arms differed on the other three.

**Without the loop, 5 of 5 runs worked on #77 as if it were clear.** #77 says only "a cent off here and there", with
no invoice and no figures. Every run tested `roundCents`, found half cents it rounds down and changed it: "Now let me
make the three unambiguous fixes (71, 73, 77) and add tests." (arm A, run 4, step 17). None said the issue gave
nothing to check it against; four closed it: "It was the rounding." (run 5, step 35). All five tied #76 to #66, and
four left it alone. All five saw that #74 reverses #25; three changed the order anyway, and said so.

**With the loop, no run worked on #74, #76 or #77.** Each flagged the three in their files before changing any code,
worked only #71 and #73, and named them in its hand-over. On #77: "Without that, a change would be a guess."
(arm B, run 2, step 23).

**Why.** #76 and #74 show their signs in the tracker: #66 is `in-progress` with an assignee, #25 a closed feature with
a test, and arm A found both. #77's problem is what it lacks, and the code had a rounding flaw to find. In arm B the
triage report, added with the first prompt and run again by each agent (arm B, run 1, step 2), says #77 "lacks: a
way to see it (a command, or steps); an example (an invoice, or the figures seen and expected)", and `LOOPS.md` says
"Do not guess what the reporter meant."

**The runs shown.** Arm A's run 3 is the only run that also wrote the fix for #76, the duplicate, noting "#76
overlaps #66." afterwards (step 52).

**What it cost.** A run took 5.02 minutes at the median without the loop and 3.3 with it; arm B changed code for two
items, arm A for three to five. The person sent nothing after the task and answered no permission prompt. Run 2 of
each arm (60.43 and 59.31 minutes) includes the same 51 minutes with nothing in either log.

**Limits.** `roundCents` does round some half cents down ("10.075 -> 10.07 expected 10.08", arm A, run 2, step 16),
so arm A fixed a real flaw that arm B left; the issue does not say whether it is the reporter's cent. Triage ran in
the working session, not where items arrive as on the card. No one answered a flag. Five runs per arm, one model.
