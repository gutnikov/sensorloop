---
title: Try it by hand
summary: The agent runs what it just wrote the way a user of that code would, and turns each defect it finds into a test that fails before the fix and passes after it.
sensors: [manual-probe]
when: After the agent has written a change and before it says it is done, and again after each fix. Before the turn ends, the defect check reads the task's defects.
failure: What comes back is not what a user of the code should get, such as a wrong value, an error or a broken page. A defect stays a failure until it has a test that failed before the fix and passes after it, or until it is handed to a person.
next: The agent writes a test that fails on the defect, then fixes the code (never the test) and tries the change again. It stops and shows a person the commands it ran and their output when it cannot tell whether what it saw is a defect or intended behaviour, or when no test can catch the defect.
---

## The loop

1. The agent runs what it just wrote the way a user of that code would, and reads what comes back:
   - a library: a one-line call from the command line, such as `python -c` that imports it and calls the new
     function;
   - a compiled language: a small demo program in a temporary folder outside the repository, built and run there;
   - an HTTP API: `curl` against the dev server;
   - a web UI: a browser driven from the command line, with screenshots the agent looks at.
2. It records each command with its output, and lists each defect it finds in the task's notes.
3. Each defect becomes a test that fails on it. The agent fixes the code until the test passes, and tries the change
   by hand again.
4. Before the turn ends, the defect check prints one line per defect with its status: `no test`,
   `test green before the fix`, `red`, `locked in` or `handed over`. The turn can end only when every defect is
   `locked in`, with a test that failed before the fix and passes after it, or `handed over` to a person with the
   commands and their output.

Trying the code by hand asserts nothing that lasts. What has to keep holding becomes a test.

## Why

Tests check only what someone thought to write a test for. Running the code by hand shows what it does with real
input, and turns up defects that no test covers. Without the test that follows, what the agent saw is lost when the
session ends; with it, the defect cannot come back unnoticed.

## Set up

- **The agent reads a tool's help first.** The instruction names the tool, such as a command-line browser driver,
  and tells the agent to read its `--help` before it starts, so it knows how to use the tool.
- **A record of what really ran.** A recorder runs each command and writes the command and its real output into one
  notes file per task; screenshots go in the same way. The agent writes output into the notes only through the
  recorder, so it cannot write down what it hoped had happened. A reviewer reads the record instead of running
  everything again.
- **For a web app**, the agent tries the change with a throwaway script for the browser driver, such as Playwright, on
  the fixtures and page objects of the end-to-end suite, so a defect it finds becomes a spec on the same fixture.
- **Scratch stays out of the repository.** Demo files go to a temporary folder; a script worth keeping becomes a test.
- **A separate tester.** An agent other than the one that wrote the change can try it by hand. It may run commands
  and open the app, but changes nothing in the product or its tests. It returns each defect with the commands it ran
  and their output. It does not block: each defect it returns becomes a failing test.
- **Wiring.** A hook before the turn ends runs the defect check when the task has defects, so the agent cannot end the
  turn while a defect is neither locked in nor handed over. CI runs the new tests, out of the agent's reach.
