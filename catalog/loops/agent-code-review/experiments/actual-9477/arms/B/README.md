# Arm B: the project with the loop

Built by hand from the card (`catalog/loops/agent-code-review/card.md`): the loop is not in the plugin's `wiring/`, so
this is what the sensorloop skill would set up following the card's "The loop" and "Set up", in the shape it gives a
project (`procedures/loops-file.md`), with the reviewer written as `procedures/agent-prompt.md` says, and in
`check.sh`'s conventions. It is the invoicer experiment's arm B (`../../../experiment/arms/B/README.md`) fitted to
Actual. The driver does not copy this file into the project.

## What it adds

| File | What it is |
|---|---|
| `.claude/agents/code-reviewer.md` | The reviewer, as in the invoicer experiment (one lens, correctness; tools that only read; high findings only, with evidence, checked a second time; a fixed answer shape; re-reviews of the open findings only), with Actual's packages and rules (`AGENTS.md`, `CODE_REVIEW_GUIDELINES.md`) in its first paragraph. |
| `.sensorloop/hooks/review.sh` | The same gate, word for word: SessionStart records the base; SubagentStart and SubagentStop on `code-reviewer` record the commit each review read and keep its report; Stop refuses to end the turn while the work is uncommitted, a review is running, or the latest commit has no review on record; four reviews at most; the same refusal three times hands over. |
| `.claude/settings.json` | Actual's own settings, unchanged (its SessionStart message, the format and component hooks after edits, `git-guard.sh` and the other guards), with the loop's four hooks merged in, and `env: CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` so that the Agent tool waits for the reviewer's report (in Claude Code 2.1.325 it runs subagents in the background by default). |
| `.sensorloop/LOOPS.md`, `.sensorloop/loops.yaml` | The loop as the skill writes it down, with Actual's commands as its CI runs them for `@actual-app/web`, and its `[AI]` commit prefix (which `git-guard.sh` enforces). |
| `CLAUDE.md.append`, `.gitignore.append` | `## Loops` and `@.sensorloop/LOOPS.md` after Actual's two import lines, and `.sensorloop/state/`. |

The image is unchanged: the hook needs git and jq, which the base image has. Actual's husky hooks are not installed in
the image (`core.hooksPath` is unset), so a commit runs only Claude Code's `git-guard.sh`.

Left out of the card, as in the invoicer experiment: other lenses, the stronger implementer in rounds four and five,
the CI job on the pull request, the person reading diffs over 500 lines, a hook refusing edits to the reviewer.

## Proved without a session

2026-11-15, in a container of the experiment's image (`--arm B --runs 0`), the overlay applied as the driver does
(copied into `/work`, `.append` files appended, hooks made executable, one commit as `node`), then each hook run as
Claude Code runs it, its JSON input on stdin, as `node` in `/work`.

**The mistake** (`hidden/mistake.patch`, the first version of #9477: the location permissions declared in
`Info.plist` and `AndroidManifest.xml`, a release note, no web code), committed as `ced092b`:

```
## SessionStart                                                      exit=0, base 604f149
## Stop, the mistake committed, no review
sensorloop: review failed (the latest commit, ced092b, has no review on record). Ask the code-reviewer agent (the Agent
tool, subagent_type "code-reviewer", ...) to review `git diff 604f149...HEAD`. Give it the task word for word and the
base commit, nothing of your own reasoning. Then fix each high finding it confirms, as .sensorloop/LOOPS.md says.
exit=2
```

**The reviewer on the mistake did not flag it.** Two runs (`claude -p --agent code-reviewer`, deepseek-flash, hooks
off; the prompt the agent is told to give: the base and the task word for word):

- Run 1 found the defect the real review found, and rated it low: 59 turns, 225 s; 41,906 input tokens, 1,629,952 read
  from cache, 26,992 output.

  ```
  VERDICT: approved
  HIGH: none
  LOG
  - packages/desktop-client/src/hooks/useLocationPermission.ts:36: low: iOS 15 is still a supported deployment target
    (Podfile/project `IPHONEOS_DEPLOYMENT_TARGET = 15.0`), but `navigator.permissions` only exists in Safari/WebKit
    16+; there the hook falls back to `state = null`, so `isPending` is false and the Request Location button is never
    rendered, and this fix's plist key only unblocks iOS 16+.
  ```

  The reviewer's prompt then gained one paragraph, in both experiments: "Rate a finding by what happens, not by how
  many meet it: a case on a platform, a version or an input the project supports is high even when few users reach
  it."

- Run 2, with that paragraph, reasoned from WebKit's sources that the status query answers `prompt` in the app's web
  view, so the button shows, and approved: 90 turns, 496 s; 77,821 input tokens, 5,685,888 read from cache, 44,890
  output.

  ```
  - Nothing else is needed for the chip to appear: WebKit's `PermissionsAPIEnabled` defaults to true on Cocoa, and
    `queryPermission` returns `prompt` in a WKWebView without a UI-delegate implementation, so `useLocationPermission`
    yields `isPending` and the "Request location" button is rendered [...]
  VERDICT: approved
  HIGH: none
  ```

So with this model the loop runs (the hooks hold the turn until a review is on record) but its sensor misses this
mistake, or ranks it below the bar. The prompt was not tuned further: fitting the reviewer to the case would prove
nothing. A review here takes 4 to 8 minutes; four rounds fit the 60-minute session, but not with much to spare.

**The record**: run 2's report fed to SubagentStart and SubagentStop (`agent_type: "code-reviewer"`) recorded
`ced092b ... .sensorloop/state/reviews/1-ced092b.md`. The Stop after it refused only because the proof had left the
updated reviewer file uncommitted in the work tree ("the work is not committed ... M .claude/agents/code-reviewer.md");
the pass after a recorded review is shown in the invoicer experiment, with the same script.

**In Claude Code itself**, the hooks' wiring (Stop refusing, the subagent in the foreground, the record, the pass) was
watched in the invoicer experiment against a stand-in for the model's API; the script and the settings' keys are the
same here.
