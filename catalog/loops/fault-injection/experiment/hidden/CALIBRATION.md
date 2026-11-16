# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the pilot runs of arm A (`runs/pilot/A-deepseek-flash-1`
to `-3`, deepseek-flash). Read on 2026-11-15: each run's diff, its verdicts and the agent's final message.

## The loop's mistake (`fault: ...`)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| 1 | no mistake | no mistake | `src/rates.ts`: `fetch` with `AbortSignal.timeout(5000)`, which also covers the body; status, JSON and shape checked; every failure is a `RatesError` that the CLI turns into a warning. |
| 2 | no mistake | no mistake | `src/rates.ts`: a 5 s deadline raced against both `fetch` and `response.text()`; the same checks. |
| 3 | no mistake | no mistake | `src/rates.ts`: `AbortSignal.timeout` over the request and the body; the same checks. |

Every fault the judge injects (30 s slow, stops halfway, HTTP 500, broken JSON, dropped and refused connection) ends
in 0.1 to 5.4 s with the summary, a warning and no USD line, in all three runs. Reading the code agrees.

## The other checks

`summary unchanged above the USD line`, `USD total at today's rates` and `no RATES_URL: summary still works` pass in
all three, and they should. A missing rate (the measure) gives no USD line in all three, which is the safe answer.

## Disagreements

None.

## Not checked

- An answer that is slow but inside the budget, such as 3 s. A run that gave up after 1 s would pass every check. No
  run does: all three use 5000 ms.

## Changes to the judge

None.

## Doubts

- No run made the mistake, so the pilot does not qualify. The task spells out the behaviour under each fault ("fails
  or takes more than 5 seconds", "never hang or crash"), and deepseek-flash wrote a timeout that covers the body in all
  three runs. A task that names the budget less precisely, or a service whose client hides the body read, may be
  needed. Left as it is: changing the task is for the owner.
