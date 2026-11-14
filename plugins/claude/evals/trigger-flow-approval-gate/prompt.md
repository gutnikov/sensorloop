---
tags: [trigger]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
---

Change our spec process: before I approve a feature that has screens, the agent has to show me a prototype of each one, and the commit check should fail when an approved spec has a screen without a prototype. Last time it skipped this even though the prototypes skill was right there.
