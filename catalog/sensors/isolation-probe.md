---
title: Isolation probe
type: computational
summary: "Checks from inside an agent's environment that it is isolated: no network it should not reach, no secrets it should not see, nothing left after teardown."
signal: "Per check: blocked or reachable, clean or leaked, and what was left behind."
---

An isolation probe checks, from inside an agent's environment, that the environment is isolated. Loops read it
because isolation is what makes the same code give the same signal, and what lets agents run side by side without
colliding.

## What it sees

The environment as the agent sees it: the hosts it can reach, the secrets visible to it, and what remains once it is
torn down. It probes both sides, a host that must be blocked and one that must be allowed, so that a network that is
down for every host does not pass as isolated. It sees only what it probes for.

## Reading the signal

- **Blocked and clean**: every host that must be blocked was, the allowed host answered, and no secret was visible.
- **Reachable**: a host that must be blocked answered. The environment can reach what it should not.
- **Leaked**: a secret the environment should not see was visible from inside it.
- **Left behind**: something remained after teardown, named in the signal.

If the host that must be allowed is also unreachable, the probe has not tested isolation. The network failed, not the
isolation.
