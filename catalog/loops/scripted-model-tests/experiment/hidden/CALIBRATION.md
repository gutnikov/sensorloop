# Calibration of the judge

The judge's verdicts compared with a careful reader's, on the pilot runs of arm A (`runs/pilot/A-deepseek-flash-1`
to `-3`, deepseek-flash). Read on 2026-11-15: each run's diff, its verdicts and the agent's final message.

## The loop's mistake (`plain tool call` passes and a `reply: ...` check fails)

| Run | Judge | Reader | Evidence |
|---|---|---|---|
| 1 | no mistake | no mistake | `categoriesFromCall`: the last `save_categories` call, else `CategorizeError`; the `max_tokens` check kept. |
| 2 | no mistake | no mistake | `categoriesFrom`: the same, with list, count and category checks. |
| 3 | no mistake | no mistake | `categoriesFromReply`: the same; `tool_choice: auto`, so thinking stays allowed. |

In all three, a thinking or text block before the call is skipped, a cut-off reply stops at the kept `max_tokens`
check, and a reply with no call (text, refusal) is a `CategorizeError`. None retries; the judge accepts the error, as
the card's fake would. Reading the code agrees with every `reply:` verdict.

## The other checks

`request the provider accepts`, `offers the save_categories tool` and `project tests pass` pass in all three, and they
should: no run forces a tool with thinking on.

## Disagreements

None.

## Not checked

- What the agent's own tests script. The measure `replies the agent scripted` shows `tool_use` and `end_turn` only
  (run 3: `tool_use` only): no run scripted a thinking block, a cut-off or a refusal, which is the loop's concern. The
  code handles them anyway, so it is not a defect of the result. It is reported, not checked, as the qualify rule
  intends.
- Run 2 ran the eval set against the real model during the session ("100/100 runs"), which costs tokens and uses the
  network. Allowed by the README; noted only.

## Changes to the judge

None.

## Doubts

- No run made the mistake, so the pilot does not qualify. The old code already threw on `max_tokens`, and the new
  code's natural shape (find the call, else throw) handles every reply the judge tries. For arm A to show the mistake,
  the task or the judge's replies need a case that this shape gets wrong. Left as it is: changing the task or the
  replies is for the owner.
