# What this experiment needs from the harness

Arm A needs nothing new. Arm B can run on fixed `person.replies` (the reviewer's comments, one round per reply), but a
reviewer comments only on what is unmet: a fixed comment that asks for a changelog line the agent already wrote reads
as noise, and the agent's answer to it ("already done") is not the loop at work.

What would do: a reply computed from the project at the turn's end, for example `person.reply_command`, a script in
`hidden/` the driver runs (out of the agent's reach) that runs the judge's `review:` checks and prints one comment per
point still open, and nothing once all are met, which ends the review.
