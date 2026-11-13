---
title: Try it by hand
summary: The agent runs what it just wrote the way a user of that code would, and turns each defect it finds into a test that fails before the fix and passes after it.
sensors: [manual-probe]
when: After the agent has written a change and before it says it is done, and again after each fix. Before the turn ends, a check reads the defects found.
failure: What comes back is not what a user of the code should get, such as a wrong value, an error or a broken page. A defect stays a failure until it has a test that failed before the fix and passes after it.
next: The agent writes the test, fixes the code, not the test, and tries the change again. When it cannot tell whether what it saw is a defect or intended, or no test can catch the defect, it stops and shows a person the commands it ran and their output.
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
4. Before the turn ends, a check prints one line per defect with its status: `no test`, `test green before the fix`,
   `red` or `locked in`. The turn cannot end while a defect is not locked in, that is, while it has no test that
   failed before the fix and passes after it.

A check by hand asserts nothing that lasts. What has to keep holding becomes a test.

## Why

Tests check only what someone thought to write a test for. Running the code by hand shows what it does with real
input, and turns up defects that no test covers. Without the test that follows, the check is lost when the session
ends; with it, the defect cannot come back unnoticed.

## Set up

- **Tools the agent learns from their help.** The instruction names the tool, such as a command-line browser driver,
  and tells the agent to read its `--help` first, so it knows how to use the tool before it starts.
- **A record of what really ran.** A recorder runs each command and writes the command and its real output into one
  notes file per task; screenshots go in the same way. The agent writes output into the notes only through the
  recorder, so it cannot write down what it hoped had happened. A reviewer reads the record instead of running
  everything again.
- **For a web app**, the check by hand is a throwaway script for the browser driver, such as Playwright, on the
  fixtures and page objects of the end-to-end suite, so a defect it finds becomes a spec on the same fixture.
- **Scratch stays out of the repository.** Demo files go to a temporary folder; a script worth keeping becomes a test.
- **A separate tester.** An agent other than the one that wrote the change can do the check by hand. It may run
  commands and open the app, changes nothing in the product or its tests, and returns each defect with the commands
  it ran and their output. It does not block: each defect it returns becomes a failing test.
- **Wiring.** A hook before the turn ends runs the check when the task has defects, so the agent cannot end the turn
  with a defect that has no test. CI runs the new tests, out of the agent's reach.
