---
title: Stall detector
summary: A hook tells the agent to step back when it repeats the same call, or the same cycle of calls, five times, and a second stall stops it for a person. The hook also caps the subagents a task can start.
sensors: [agent-activity]
when: After every tool call, and before every spawn, a call that starts a subagent. A new prompt from the person starts a new task and resets the counts.
failure: The last five calls are the same, or are one cycle of two to five calls repeated five times. Or a subagent that is not an orchestrator tries to spawn, or a task tries its eleventh spawn.
next: After the first stall the agent steps back, changes its approach and goes on. A refused spawn leaves the work to the agent that asked, which does it itself. A second stall in the same task stops the task, and the person sees the repeated calls; a second refused spawn stops it too, and the person sees the tree of spawns. The person decides whether to change the task, give a hint or let it go on.
---

## The loop

1. After every tool call, a hook turns the call into a key, a hash of the tool's name and its arguments, and keeps
   the last 25 keys of the task.
2. It reports a stall when the last five keys are the same, or when the last keys are one cycle of two to five calls
   repeated five times.
3. On the first stall, the agent gets a message that names the repeated calls and tells it to step back: check that
   it is making progress, look at what it has done, and change its approach instead of repeating the same calls.
4. A second stall in the same task stops the task, with the repeated calls in front of the person.
5. Before each spawn, the hook counts it. A spawn from a subagent that is not an orchestrator, or the eleventh in one
   task, is refused: the agent that asked is a leaf, and does the work itself. A second refusal in the task stops the
   task for the person, with the tree of spawns.
6. A new prompt from the person starts a new task, and clears the keys and both counts.

Hashing the arguments keeps batch work out: the same edit over 20 files gives 20 different keys, and an agent that
changes different code between builds is debugging, so its keys differ.

## Why

An agent can repeat itself and no check stops it: it reads the same file again and again, or applies the same edit
and gets the same error each time. A test that fails again says the work is wrong, not that the agent is going round
in circles, so the agent runs until its budget ends, and the person finds out at the end. Spawns run away as quietly:
each has new arguments, so no key repeats, and one review has reached more than 50 agents. The loop ends both early,
with the evidence in front of the person.

## Set up

- **One script, three hooks**: after every tool call, on each new prompt, and before each spawn (`PostToolUse`,
  `UserPromptSubmit` and `PreToolUse` in Claude Code, or the equivalents in other coding agents). It keeps its keys
  per session and per subagent, so parallel subagents do not mix their calls, and sorts the field names in the
  arguments before hashing, so their order does not matter.
- **A message, then a stop.** The message names the calls in short form, such as `Edit src/billing.ts` or
  `Bash npm test`; the stop carries its reason, such as `stall: <the cycle>, twice in this task`.
- **The spawn cap is a hook, not a line in a prompt.** A rule in one skill's text covers only that skill and depends
  on the model obeying it; a blanket rule against spawning makes a subagent decline the task it was spawned for. The
  hook refuses only the spawn, and lets through the types its configuration lists as orchestrators. The cap of 10 is
  a line in that configuration; raising it, for example to give each ticket its own implementer, is a change a person
  reviews.
- **A rule before the hook fires**, in the agent's instructions: after more than three failed attempts at the same
  failure, restate the task, list the assumptions and which might be wrong, and propose a different approach. The
  hook is the check; the rule makes it fire less often.
- **Five, not fewer.** A lower threshold trips on an agent that is waiting on a slow command.
- **Out of the agent's reach.** A hook refuses the agent's writes to the script and to the hook settings.

## Where it does not apply

A hook sees only tool calls. It misses the same plan restated in text, or the same fix in slightly different words.
A model judge can catch those, but it only advises until it is calibrated on runs a person has labelled, since a
wrong stall interrupts good work. An agent that produces no output is a stall no hook sees: a wrapper that runs it
unattended fails the run after ten minutes of silence.
