Both arms made `categorize` cheaper the same way: in all 10 runs the agent dropped the notes from the prompt and sent
several invoices per request, and five runs turned the model's thinking off. Every agent ran the eval set after its
change and saw 100%. After the session, the eval set ran on the base and on the agent's version, three times each, each
case as a file of one invoice.

**Without the loop, no run lowered the pass rate, and with it none did.** Every version kept the base's 100%.

**What the loop did.** The loop's file asks the agent, when the command's request changes, to "make `scripts/eval.ts`
run that one, so that the evals measure what ships", and all five arm B runs rewrote the eval script to send the cases
in batches; no arm A run touched it. Its hook at the end of the turn compared the evals with the base's and never
refused a stop. With nothing to catch, these runs show what it costs, not what it catches.

**The judge's first count was wrong.** It first counted one mistake in each arm (arm A run 4, arm B run 4): the case
"E-learning seats, 25 users" came back as Software instead of Training. The judge named each case's invoice after the
case (`EVAL-e-learning`), and both versions put the invoice's id into the request. With invoices named like real ones
(`INV-1001`), both runs kept 100%, and so did the pilot run that had made the experiment qualify
(`hidden/CALIBRATION.md`).

**What it cost.** A run took 6.02 minutes at the median without the loop and 8.74 with it. The person's only message,
in arm B's run 1, was "Please go ahead and implement it.": a 25-second pause looked like the end of the agent's turn,
but it was still working.

**Limits.** Arm A's run 5 is left out because the model API ran out of credit during it. The measure never sends a batch
of many invoices, as a file of 412 does. Five runs per arm, one model.
