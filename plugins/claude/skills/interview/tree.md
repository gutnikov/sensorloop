# The tree of a project's needs

Where an interview about a project's loops starts. Each branch has its weight, its question in plain words, the facts
to read before asking it, what its answers open, the loops it decides, the options the earlier answers leave open,
and its default when nobody answers. When the facts settle a branch, do not ask it; say what you found in the summary
at the end.

```
product ───┬── path ──┬── observe
           │          └── prod-db
           ├── harm ───── its follow-up
           ├── acts, clients
           └── tests ──── wait
autonomy ──┬── call ──┬── gates     (after path too)
           │          ├── approve
           │          └── review
           ├── handoff, alone
           ├── spend
           └── keep
```

Two roots: **product** (what is being built, asked only when the code does not show it) and **autonomy** (how much
the agent does on its own). Every other branch hangs off them.

## The order

Ask by weight ([SKILL.md](SKILL.md), "What to ask first"), and within a weight in this order, skipping what the facts
settle, what an answer made moot, and what waits for a question still open:

| Weight | Branches |
|---|---|
| High | product (when the code does not show it), autonomy, harm, spend, path (what the repository does not show) |
| Medium | call, gates, approve, observe, harm's follow-up, handoff, alone, acts, clients, prod-db |
| Low | review, tests, wait, keep |

Five turns hold at most ten questions. In a typical project the high ones and the first medium ones fill them, and the
low ones take their defaults.

## product: what is being built, and who relies on it

A root. **Weight: high**, when the code does not show it. Otherwise state what you found under the table of tools,
and let the person correct it.

- **Ask**: What are you building, and who uses what it produces: people in a browser or an app, other code through an
  API or a package, players, devices, a model's users? Only that: who would notice a break, and what would hurt, are
  **observe** and **harm**.
- **Facts first**: the README, the manifests, the folders (an API spec, a mobile project, firmware, prompts).
- **Opens**: **path**, **harm** and **tests**; a feature where a model answers or acts → **acts** (may it act in a
  user's account, call tools, change their data?); an API, a package, a file or event format that others use →
  **clients** (who builds on it, and may a change break them, with notice?).
- **Decides**: `e2e-browser`, `agentic-manual-testing`, `shipped-artifact-check`, `api-breaking-changes`,
  `approved-fixtures`, `llm-evals`, `scripted-model-tests`, `skill-trigger-eval`, `config-validation`,
  `lighthouse-ci`.
- **Default**: as found.

## autonomy: how much the agent does on its own

A root. **Weight: high**, and the first question of almost every interview: its answer decides which options the
questions after it can offer.

- **Ask**: How much should the agent do on its own? Each step in a session you watch, stepping in when it drifts; a
  whole task handed over, and you check the result; several tasks at once with nobody watching, in parallel or
  overnight; started by issues or comments, inside CI.
- **Facts first**: agent jobs in CI, `.claude/settings.json`, scripts that start agents. They show what runs today, not
  what the person wants: state them, and still ask.
- **Opens**: **call**, **spend**, **keep** and **gates**; nobody watching → **handoff** (when the agent stops or gives
  up, how does the work reach the person: a pull request, an issue, a message?) and **alone** (what may it do with
  nobody there that a watched agent would ask about first?); several at once → how their branches come together.
- **Decides**: `stall-detector`, `observe-and-interrupt`, `afk-run-handoff`, `approval-reviewer-agent`,
  `agent-branch-integration`, `isolated-environment`, `agent-ci-hardening`.
- **Default**: watched in a session.

## harm: what would hurt most if a change broke it

After **product**. **Weight: high**: it decides more loops than any other branch.

- **Ask**: What would cost real money, users or sleep if a change broke it? Any of: data people cannot lose; what
  others build on (an API, events, file formats, older versions); an action that cannot be taken back (a message to
  every user, a release, an apply to production infrastructure); money the product moves or spends; wrong numbers or
  answers that people act on; speed at peak traffic; how fast pages load and how they look; attackers (it faces the
  internet, or holds personal data); a compromised dependency, plugin or MCP server; services it relies on going slow
  or down; old code nobody fully understands; an audit; nothing serious yet.
- **Options after**: **product** puts first the harms that the product and the facts make likely (an API others call
  → what others build on; a migrations folder → data; payments in the code → money), and leaves out the ones it rules
  out (no pages → how pages load and look). "Nothing serious yet" is always an option.
- **Opens**: one follow-up (**weight: medium**) for the harm the person puts first, to make it concrete enough to
  check: which data, and has a backup of it ever been restored; which interfaces are public; which actions exactly
  (they join **gates**); which jobs cost; how a wrong number is noticed today; which parts nobody understands. Other
  harms named get a follow-up only when the facts cannot make them concrete and a turn is left.
- **Decides**: `backup-restore-rollback`, `db-migration-lint`, `api-breaking-changes`, `approved-fixtures`,
  `risky-action-gates`, `llm-evals`, `load-testing`, `lighthouse-ci`, `secret-scanning`, `dast`,
  `dependency-scanning-sbom`, `third-party-extension-scan`, `fault-injection`, `architecture-fitness-functions`,
  `mutation-testing`, `human-diff-review`.
- **Default**: nothing named; the loops every project gets, and no more.

## spend: what the loops may cost

After **autonomy**. **Weight: high**: a "no" closes every loop that calls a model.

- **Ask**: Besides the coding agent, may other agents and checks call a model, for example a reviewer that reads each
  diff? It costs tokens, and it sends the code to the model's provider. No; yes, on your machines; yes, also in CI and
  scheduled jobs.
- **Options after**: **autonomy**. An agent that runs only in sessions on the person's machines does not need the CI
  option, so offer it last. An agent started in CI needs a model there anyway: say so in the question, and ask only
  about the checks around it.
- **Opens**: yes → a ceiling (per change, per month), and any code that must not leave (a folder, a client's code).
- **Decides**: whether `agent-code-review`, `verification-subagent`, `approval-reviewer-agent`, `llm-evals`,
  `agent-calibration`, `triage` and `repo-health-agent` can be proposed at all.
- **Default**: no model calls in CI.

## path: where a change goes after the machine

After **product**. **Weight: high**, for what the repository does not show; usually the facts settle it.

- **Ask**, only what the repository does not show: After a merge, where does a change go: a preview per branch, a
  shared staging, production, a release people install? Does any of it happen without a person?
- **Facts first**: CI workflows, deploy configuration (a Dockerfile, a platform's config file, charts, infrastructure
  code), a migrations folder, steps that publish to a store or a registry.
- **Opens**: production or a release people install → **observe**; migrations → **prod-db** (can the agent reach the
  production database, and must it never?); any deploy or release → **gates**.
- **Decides**: `ci-clean-infra`, `preview-environments`, `health-checks-smoke`, `release-confirmation`,
  `db-migration-lint`, `shipped-artifact-check`.
- **Default**: as found; nothing deployed when nothing shows a deploy.

## call: when the agent may call the person

After **autonomy**. **Weight: medium**: it decides how the gates hold and whom a stuck agent reaches.

- **Ask**: When is it fine for the agent to call you, and how? Whenever it is unsure; only before an action that
  cannot be undone, or when it is stuck; only at points agreed in advance (a plan, a demo, the finished change); or
  never while it works, only through what it leaves behind (a pull request, an issue, a message). At what hours, and
  where: in the session, or a channel you read later?
- **Options after**: **autonomy**. Watched in a session → in the session: whenever unsure, before what cannot be
  undone and when stuck, or at agreed points. A task handed over → before what cannot be undone and when stuck, at
  agreed points, or only through the pull request. Nobody watching → never in the session: through a pull request,
  an issue or a message, and at what hours a message may wake them.
- **Opens**: **approve**, **review** and **gates**; nobody to call while it works → a gated action is refused and
  handed over, not asked.
- **Decides**: how `risky-action-gates` holds an action (ask, or refuse and hand over), `observe-and-interrupt`,
  `approval-reviewer-agent`, whom `stall-detector` and `afk-run-handoff` hand the work to, `plan-approval`,
  `result-demo`.
- **Default**: follows **autonomy**: in the session, before an action that cannot be undone and when it is stuck;
  with nobody watching, through a pull request, never while it works.

## gates: what never runs without a person

After **call** and **path**, so that it names the project's own commands and says what happens to a gated action when
nobody can be called. **Weight: medium**.

- **Ask**: Which actions must wait for your yes? Name them with the project's commands: a push, the deploy (the command
  found), a migration, a delete, a message sent outside, anything that spends money.
- **Options after**: **path** and **harm**: only the actions the project has, by their commands, and the actions the
  person named as hard to take back first. **call**: when nobody can be called while the agent works, each option
  says that the action is refused and handed over, not asked.
- **Opens**: nothing; each action named becomes a gated command.
- **Decides**: `risky-action-gates`, and the list it holds.
- **Default**: pushes, deploys, migrations and deletes wait for a person.

## approve: where the person steps in

After **call**. **Weight: medium**.

- **Ask**: What do you want to see and approve before the work goes on: a plan before the code, the spec or the tests
  before the code, a prototype before a screen is built, a demo of the result, the diff? Or only the finished change?
- **Options after**: **call**. When the agent may not call the person while it works, a step to approve is something
  it leaves behind and waits on (a plan in a pull request, a demo), never a question in the session. **product**: no
  screens → no prototype.
- **Decides**: `plan-approval`, `spec-before-tests`, `result-demo`, `human-diff-review`, `observe-and-interrupt`. A
  step the catalog has no loop for, such as a prototype, goes to [diagnose](../sensorloop/procedures/diagnose.md) as a
  step to add.
- **Default**: only the finished change, and the person's yes to the setup.

## observe: how a break in production is found

After **path**, when the change reaches people. **Weight: medium**.

- **Ask**: When something breaks for the people who use it, how do you find out today: an error tracker, logs,
  metrics, alerts, or someone complaining? Should the agent read them, and after which events?
- **Facts first**: monitoring SDKs in the dependencies, logging and alert configuration: the "outside the project"
  rows of the table of tools.
- **Options after**: the tools found. Name the ones found first; when none were found, offer "someone complains" and
  "add an error tracker".
- **Decides**: `error-tracking`, `structured-logs`, `traces-opentelemetry`, `release-confirmation`, `user-feedback`,
  `triage`, `bug-failing-test-fix`.
- **Default**: as found.

## review: who looks at a change before it ships

After **call**. **Weight: low**: the default fits most projects with one person.

- **Ask**: Only you; a teammate reviews each pull request; required reviewers and a record of who approved what; or
  nobody reads the code closely, and you judge by trying the result?
- **Facts first**: branch protection, a CODEOWNERS file, pull request templates.
- **Options after**: **approve**, when the person already said they approve the diff or a demo: do not ask again what
  they named. **spend**: no model calls → no reviewer agent in the recommendation.
- **Decides**: `human-diff-review`, `agent-code-review`, `verification-subagent`, `result-demo`.
- **Default**: only the person.

## tests: what the tests are like

After **product**. **Weight: low**: running them answers most of it.

- **Facts first**: run them, as setup step 1 does: do they pass, how long do they take, how many are there. A CI
  history with reruns shows flaky ones.
- **Ask**, only what running cannot tell: Do you trust them to catch a regression? Are some known to be flaky?
- **Opens**: few or none → is the first test a smoke test that the app starts at all?; slow → **wait**.
- **Decides**: `run-tests-first`, `red-green-tdd`, `bug-failing-test-fix`, `mutation-testing`, `ci-clean-infra`,
  `e2e-browser`.
- **Default**: as found when run.

## wait: how long a check may hold the agent

After **tests**, for each command that takes more than about 20 seconds. **Weight: low**.

- **Ask**: `<command>` takes `<time>`. Should it run after each edit, when the agent ends its turn, before each
  commit, or only in CI?
- **Options after**: **autonomy**: with nobody watching, a slow check at the end of the turn costs no one's time, so
  recommend it there.
- **Decides**: the wiring of `type-check-and-build`, `run-tests-first` and `lint-with-fix-instructions`.
- **Default**: after each edit when it takes under about 20 seconds; otherwise when the turn ends. A suite of several
  minutes: the agent runs the part its change touches, and CI the whole of it.

## keep: what the setup must leave alone

After **autonomy**. **Weight: low**.

- **Ask**: Is there anything the agent and its loops must not change: files, branches, settings, hooks or CI jobs that
  someone else owns?
- **Facts first**: the hooks already in `.claude/settings.json`, a CODEOWNERS file over CI.
- **Decides**: where the wiring goes: a hook, an instruction in `LOOPS.md`, or a CI job.
- **Default**: nothing beyond what is there; existing settings are merged into, never dropped.

## When the needs change: what to reopen

| The change | Reopen |
|---|---|
| A new language, framework or command | tests, wait |
| CI added or moved | autonomy, spend, review |
| A deploy, a preview or a production database added | path, observe, gates, harm |
| A new product, or new people relying on it | product, harm |
| A teammate joins, or reviews change | call, review, approve |
| Agents start working with nobody watching | autonomy, call, gates, spend |
| The person changes what the loops may do or cost | the branch it belongs to |
