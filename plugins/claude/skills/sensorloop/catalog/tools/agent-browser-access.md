---
title: Browser access for the agent
summary: Gives the agent itself a browser to act in, through the page's accessibility tree, with the console and network in view.
sensors: [browser-run, manual-probe, screenshot]
layer: agent
---

This tool gives the coding agent a browser of its own to act in while it works. It sees the page through the
accessibility tree, with the console and the network in view.

## Finding it

It is added to the coding agent as an MCP server, in the agent's MCP configuration: a project file shared with the
team (`.mcp.json` in Claude Code) or the user's own settings. The agent's list of connected servers (`/mcp` in Claude
Code) shows whether it is there and running.

## Using it

- **Explore before writing a test**: open the app, take a snapshot of the accessibility tree, act on elements by role
  and name, and note what a test should check.
- **Read the console and the network directly**: script errors and failed requests come from the browser, not from a
  guess about the page.
- **Take a screenshot** when the result has to be seen, not only read.
- **Start from a known state**: an isolated browser profile for each session, so logins and caches left by earlier
  runs do not change what it sees.

Examples: Playwright MCP, Chrome DevTools MCP.
