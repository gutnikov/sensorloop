In all 10 runs the agent built `--details` right. On the judge's hidden file each bucket lists its invoices, longest
overdue first, with amounts that add up, and the report without the flag is byte for byte what it was. Every
hand-over showed criteria 1 to 3 with a run of `aging --details` and its output. The runs differ on criterion 4: that
`invoicer aging` without the flag prints exactly what it prints today.

**Without the loop, 2 of 5 runs handed over criterion 4 without the command that showed it.** Four runs diffed the
report against its output from before the change and found the two the same. In the hand-over, run 4 wrote the
command as `$ diff <(HEAD version) <(current version) && echo IDENTICAL` (arm A, run 4, step 47), and run 5 as
`$ diff ...` (arm A, run 5, step 38). The person sees the word `IDENTICAL` and has to take the agent's word for what
was compared. Run 2 diffed the same way and showed it with its commands and the output they printed (arm A, run 2,
step 30), so it counts as shown.

**With the loop, every run showed all four criteria with a command and its output.** Each hand-over has the layout
`LOOPS.md` gives: a line "Criteria 1-3: …" over the run of `aging --details`, and a line "Criterion 4: …" over the
run without the flag, both from runs the agent had just made. Run 4 first ran the report through `tail -n +5`, then
wrote "Let me capture the final evidence runs untrimmed:" and ran it again (arm B, run 4, step 29). The hook at the
end of the turn ran once in each run and refused nothing.

**Why.** The README asks for "the command you ran and its output as it printed", and leaves the form to the agent.
For "prints exactly what it prints today", 4 of 5 agents in arm A checked against the old output with a diff, and two
of them then wrote that diff up in shorthand. `LOOPS.md` gives the form: a line naming the criterion, then
`$ <command>` and its output, "copied from the run, never retyped, trimmed or described". All five agents in arm B
followed it, so the hook had nothing to refuse: in this round the instruction did the work. One of them read the
hook's code before handing over: "Let me check the loop hook to format the handover correctly." (arm B, run 3,
step 31).

**The runs shown.** By the rule, the arm A replay is a run without the mistake, since 3 of 5 runs made none: run 2,
whose criterion 4 is a diff that really ran (arm A, run 2, step 23), shown with its commands. The mistake itself is
in run 4's hand-over (arm A, run 4, step 47). The arm B replay has no moment where the hook acts, since it passed the
first hand-over.

**What it cost.** A run took 3.11 minutes at the median without the loop and 2.88 with it. No run needed a message
from the person.

**Limits.** In the card's loop a person answers the demo with pass or fail; here no one does, so arm B measures the
evidence alone. Arm B's evidence for criterion 4 is the report as it prints now, which does not show by itself that
it matches the old one. Only one run of arm B diffed against the old code (arm B, run 1, step 37), and its
hand-over says so in words.
