---
title: Stall detector
summary: A hook that watches every tool call tells the agent to step back when it repeats the same call or cycle five times, stops it for a person on a second stall, and keeps a subagent from starting agents of its own.
sensors: [agent-activity]
placement: inner
when: After every tool call, and before every call that starts a subagent. A new prompt from the person starts the count again.
failure: The last five calls are the same, or are one cycle of two to five calls repeated five times. Or a subagent that is not an orchestrator starts an agent, or a task starts its eleventh.
next: After the first stall the agent steps back, changes its approach and goes on. A second stall in the same task, or a second refused spawn, stops it, and the person sees the repeated calls and decides whether to change the task, give a hint or let it go on.
---

## The loop

1. After every tool call, a hook turns the call into a key, a hash of the tool's name and its arguments, and keeps
   the last 25 keys of the task.
2. It reports a stall when the last five keys are the same, or when the last keys are one cycle of two to five calls
   repeated five times.
3. On the first stall, the agent gets a message that names the repeated calls and tells it to step back: check that
   it is making progress, look at what it has done, and change its approach instead of repeating the same calls.
4. A second stall in the same task stops the agent, with the repeated calls in front of the person.
5. Before a call that starts a subagent, the hook counts the spawn. A spawn from a subagent that is not an
   orchestrator, or the eleventh in one task, is refused: the agent is a leaf, and does the work itself. A second
   refusal stops it for the person, with the tree of spawns.
6. A new prompt from the person starts a new task, and clears the keys and both counts.

Hashing the arguments keeps batch work out: the same edit over 20 files gives 20 different keys, and an agent that
changes different code between builds is debugging, so its keys differ.

## Why

An agent can repeat itself while every call succeeds: it reads the same file again, or applies the same edit and gets
the same error. No check fires, so it runs until its budget ends, and the person finds out at the end. Agents that
start agents run away as quietly: each spawn has new arguments, so no key repeats, and one review has reached more
than 50 agents. The loop ends both early, with the evidence in front of the person.

## Set up

- **One script, three hooks**: after every tool call, on each new prompt, and before each call that starts a subagent
  (`PostToolUse`, `UserPromptSubmit` and `PreToolUse` in Claude Code, or the equivalents in other coding agents). It
  keeps its keys per session and per subagent, so parallel subagents do not mix their calls, and sorts the
  arguments' keys before hashing, so their order does not matter.
- **A message, then a stop.** The message names the calls in short form, such as `Edit src/billing.ts` or
  `Bash npm test`; the stop carries its reason, such as `stall: <the cycle>, twice in this task`.
- **The spawn cap is a hook, not a line in a prompt.** A guard in one skill's text covers only that skill and depends
  on the model obeying it; a blanket rule against delegating makes a dispatched agent decline its task. The hook
  refuses only the spawn, and lets through the types its configuration lists as orchestrators. Raising the cap of
  10, for one implementer per ticket, is a reviewed line in that configuration.
- **A rule before the hook fires**, where the agent reads its instructions: after more than three failed attempts at
  the same failure, restate the task, list the assumptions and which might be wrong, and propose a different
  approach. The hook is the check; the rule makes it fire less often.
- **Five, not fewer.** A lower threshold trips on an agent that is waiting on a slow command.
- **Out of the agent's reach.** A hook refuses the agent's writes to the script and to the hook settings.

## Where it does not apply

A hook sees only tool calls. It misses the same plan restated in text, or the same fix in slightly different words;
a model judge can catch those, but it only advises until it is calibrated, since a wrong stall interrupts good work.
An agent that produces no output is a stall no hook sees: a wrapper that runs it unattended fails the run after ten
minutes of silence.
