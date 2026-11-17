---
type: llm
focus: trace
---

A setup ends with a report to the person on the loops it set up.

PASS if all of these hold:
- The agent's last message (or the end of its final reply) has a report with one entry per loop it wired or tried: when the loop fires, how it was checked (the break made on purpose, or what was run), and the result (works, waits for something, or did not fire and why).
- The results agree with the trace: a loop reported as working was actually made to fail and seen to fire in the trace; a loop that was not checked is not reported as working.
- Below or beside it, the report names the loops only proposed and what each needs, the defaults it assumed because the person could not answer, and the files it changed.
FAIL if there is no such report, if it reports a loop as working that the trace never made fail, or if it leaves out the defaults it assumed.
