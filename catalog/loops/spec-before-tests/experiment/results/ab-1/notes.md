The issue asks for `invoicer reminders` with five acceptance criteria, and leaves one case open: a customer with an
invoice at the collection agency who also has newer overdue invoices. After the agent's first turn the person says how
it goes: leave all of that customer's invoices out. No agent in either arm named the case itself. In all 10 runs the
command works by the end, CI is green, and a test checks the person's rule.

**Without the loop, all 5 runs built before anyone answered.** Each wrote the command and its tests in its first turn
and asked nothing. All five left out only the invoice over 90 days and kept the same customer's newer ones; in 4 of 5
an AC4 test expected them listed. The example file holds the case, and each run listed it while trying the command:
"the >90-day ones (`INV-1003`, `INV-1006`) are excluded" (arm A, run 1, step 40), with the same customer's INV-1005
still in the list. The answer came as a correction to finished work, and every run changed its code and its tests:
"Good catch — that's a customer-level exclusion, not an invoice-level one." (arm A, run 2, step 35).

**With the loop, no run built before the answer.** All five ended their first turn with questions, before any edit.
None was the open case: every run asked how ids compare in a tie, whether today is the UTC or the local date, and how
to quote a name with a comma. The person's answer came anyway, and since nothing was built, it went into the first
tests: each run has one that fails when the customer's other invoices are listed. In 3 of 5 runs the agent met the
answer with more questions, "The five earlier questions are still unanswered, so I can’t start on code or tests yet"
(arm B, run 1, step 21), until the person said "Please go ahead and implement it." The hook that checks for a test per
criterion never refused: every run named all five.

**Why.** Both arms' CONTRIBUTING.md makes the criteria the spec and asks for a test of each, but says nothing about
what they leave open, so arm A took them as complete and built its guess. Arm B's `LOOPS.md` says to ask the open cases
in one message and end the turn there: "the project loop forbids me settling them myself" (arm B, run 4, step 20). The
agent's own list missed the case every time; what helped was the stop, which let the person give the rule before there
was code to undo.

**The runs shown** are typical of their arms. In arm B's replay, the first two turns end with questions, and the first
"CI is green" ran on the project before any change.

**What it cost.** A run took 4.19 minutes at the median without the loop and 6.89 with it. The three runs of arm B
that needed "Please go ahead and implement it." took 6.89, 7.52 and 9.63 minutes; the other two took 4.11 and 4.03.
That message is the only one the person typed beyond the answer, which every run of both arms received; the table
counts both.

**Limits.** The person states the open case after the first turn in every run, whatever the agent asked. These runs
show that the loop makes the agent stop before it builds, not that it finds the gap: none did. The hook never refused,
so they do not test it.
