# What this experiment needs from the harness

Arm A needs nothing new. Arm B does: in the loop the person answers the demo, `pass` or `fail: <what differs>`, and
the answer depends on what the agent built. `person.replies` are fixed text, said whatever the turn held, so a fixed
`fail: the longest overdue invoice should come first` would be wrong for a run that got the order right.

What would do: a reply computed from the project at the turn's end, for example `person.reply_command`, a script in
`hidden/` the driver runs (as for the judge, out of the agent's reach) whose output, if any, is what the person types,
and which prints nothing for a pass.
