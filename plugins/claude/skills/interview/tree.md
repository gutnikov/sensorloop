# The tree of a project's needs

Where an interview about a project's loops starts. Each branch has its question in plain words, the facts to read
before asking it, what its answers open, the loops it decides, and its default when nobody answers. When the facts
settle a branch, do not ask it; say what you found in the summary at the end.

```
product ───┬── path ──┬── observe
           │          └── prod-db
           ├── harm ───── one follow-up per harm named
           ├── acts, clients
           └── tests ──── wait
autonomy ──┬── handoff, alone
           ├── spend
           ├── keep
           └── gates      (after path and call too)
call ──────┬── review ─── approve
           └── gates
```

Three roots, asked first: **product** (what is being built, when the code does not show it), **autonomy** (how much
the agent does on its own) and **call** (when it may call the person). The first round is those three and nothing
else; every other branch hangs off them and waits for a later round.

## product: what is being built, and who relies on it

A root. Ask it only when the code does not show it; otherwise state what you found, and let the person correct it.

- **Ask**: What are you building, and who uses what it produces: people in a browser or an app, other code through an
  API or a package, players, devices, a model's users? Only that: who would notice a break, and what would hurt, are
  **observe** and **harm**, in later rounds.
- **Facts first**: the README, the manifests, the folders (an API spec, a mobile project, firmware, prompts).
- **Opens**: **path**, **harm** and **tests**; a feature where a model answers or acts → **acts** (may it act in a
  user's account, call tools, change their data?); an API, a package, a file or event format that others use →
  **clients** (who builds on it, and may a change break them, with notice?).
- **Decides**: `e2e-browser`, `agentic-manual-testing`, `shipped-artifact-check`, `api-breaking-changes`,
  `approved-fixtures`, `llm-evals`, `scripted-model-tests`, `skill-trigger-eval`, `config-validation`,
  `lighthouse-ci`.
- **Default**: as found.

## autonomy: how much the agent does on its own

A root.

- **Ask**: How much should the agent do on its own? Each step in a session you watch, stepping in when it drifts; a
  whole task handed over, and you check the result; several tasks at once with nobody watching, in parallel or
  overnight; started by issues or comments, inside CI.
- **Facts first**: agent jobs in CI, `.claude/settings.json`, scripts that start agents. They show what runs today, not
  what the person wants: state them, and still ask.
- **Opens**: **spend**, **keep** and **gates**; nobody watching → **handoff** (when the agent stops or gives up, how
  does the work reach the person: a pull request, an issue, a message?) and **alone** (what may it do with nobody
  there that a watched agent would ask about first?); several at once → how their branches come together.
- **Decides**: `stall-detector`, `observe-and-interrupt`, `afk-run-handoff`, `approval-reviewer-agent`,
  `agent-branch-integration`, `isolated-environment`, `agent-ci-hardening`.
- **Default**: watched in a session.

## call: when the agent may call the person

A root.

- **Ask**: When is it fine for the agent to call you, and how? Whenever it is unsure; only before an action that
  cannot be undone, or when it is stuck; only at points agreed in advance (a plan, a demo, the finished change); or
  never while it works, only through what it leaves behind (a pull request, an issue, a message). At what hours, and
  where: in the session, or a channel you read later?
- **Opens**: **review** and **gates**; nobody to call while it works → a gated action is refused and handed over, not
  asked.
- **Decides**: how `risky-action-gates` holds an action (ask, or refuse and hand over), `observe-and-interrupt`,
  `approval-reviewer-agent`, whom `stall-detector` and `afk-run-handoff` hand the work to, `plan-approval`,
  `result-demo`.
- **Default**: in the session, before an action that cannot be undone and when it is stuck.

## path: where a change goes after the machine

After **product**.

- **Ask**, only what the repository does not show: After a merge, where does a change go: a preview per branch, a
  shared staging, production, a release people install? Does any of it happen without a person?
- **Facts first**: CI workflows, deploy configuration (a Dockerfile, a platform's config file, charts, infrastructure
  code), a migrations folder, steps that publish to a store or a registry.
- **Opens**: production or a release people install → **observe**; migrations → **prod-db** (can the agent reach the
  production database, and must it never?); any deploy or release → **gates**.
- **Decides**: `ci-clean-infra`, `preview-environments`, `health-checks-smoke`, `release-confirmation`,
  `db-migration-lint`, `shipped-artifact-check`.
- **Default**: as found; nothing deployed when nothing shows a deploy.

## observe: how a break in production is found

After **path**, when the change reaches people.

- **Ask**: When something breaks for the people who use it, how do you find out today: an error tracker, logs,
  metrics, alerts, or someone complaining? Should the agent read them, and after which events?
- **Facts first**: monitoring SDKs in the dependencies, logging and alert configuration.
- **Decides**: `error-tracking`, `structured-logs`, `traces-opentelemetry`, `release-confirmation`, `user-feedback`,
  `triage`, `bug-failing-test-fix`.
- **Default**: as found.

## harm: what would hurt most if a change broke it

After **product**.

- **Ask**: What would cost real money, users or sleep if a change broke it? Any of: data people cannot lose; what
  others build on (an API, events, file formats, older versions); an action that cannot be taken back (a message to
  every user, a release, an apply to production infrastructure); money the product moves or spends; wrong numbers or
  answers that people act on; speed at peak traffic; how fast pages load and how they look; attackers (it faces the
  internet, or holds personal data); a compromised dependency, plugin or MCP server; services it relies on going slow
  or down; old code nobody fully understands; an audit; nothing serious yet.
- **Opens** one follow-up per harm named, to make it concrete enough to check: which data, and has a backup of it ever
  been restored; which interfaces are public; which actions exactly (they join **gates**); which jobs cost; how a wrong
  number is noticed today; which parts nobody understands.
- **Decides**: `backup-restore-rollback`, `db-migration-lint`, `api-breaking-changes`, `approved-fixtures`,
  `risky-action-gates`, `llm-evals`, `load-testing`, `lighthouse-ci`, `secret-scanning`, `dast`,
  `dependency-scanning-sbom`, `third-party-extension-scan`, `fault-injection`, `architecture-fitness-functions`,
  `mutation-testing`, `human-diff-review`.
- **Default**: nothing named; the loops every project gets, and no more.

## gates: what never runs without a person

After **autonomy**, **call** and **path**, so that it names the project's own commands and says what happens to a
gated action when nobody can be called.

- **Ask**: Which actions must wait for your yes? Name them with the project's commands: a push, the deploy (the command
  found), a migration, a delete, a message sent outside, anything that spends money.
- **Opens**: nothing; each action named becomes a gated command.
- **Decides**: `risky-action-gates`, and the list it holds.
- **Default**: pushes, deploys, migrations and deletes wait for a person.

## review: who looks at a change before it ships

After **call**.

- **Ask**: Only you; a teammate reviews each pull request; required reviewers and a record of who approved what; or
  nobody reads the code closely, and you judge by trying the result?
- **Facts first**: branch protection, a CODEOWNERS file, pull request templates.
- **Opens**: **approve**.
- **Decides**: `human-diff-review`, `agent-code-review`, `verification-subagent`, `result-demo`.
- **Default**: only the person.

## approve: where the person steps in

After **review**.

- **Ask**: What do you want to see and approve before the work goes on: a plan before the code, the spec or the tests
  before the code, a prototype before a screen is built, a demo of the result, the diff? Or only the finished change?
- **Decides**: `plan-approval`, `spec-before-tests`, `result-demo`, `human-diff-review`, `observe-and-interrupt`. A
  step the catalog has no loop for, such as a prototype, goes to [diagnose](../sensorloop/procedures/diagnose.md) as a
  step to add.
- **Default**: only the finished change, and the person's yes to the setup.

## tests: what the tests are like

After **product**.

- **Facts first**: run them, as setup step 1 does: do they pass, how long do they take, how many are there. A CI
  history with reruns shows flaky ones.
- **Ask**, only what running cannot tell: Do you trust them to catch a regression? Are some known to be flaky?
- **Opens**: few or none → is the first test a smoke test that the app starts at all?; slow → **wait**.
- **Decides**: `run-tests-first`, `red-green-tdd`, `bug-failing-test-fix`, `mutation-testing`, `ci-clean-infra`,
  `e2e-browser`.
- **Default**: as found when run.

## wait: how long a check may hold the agent

After **tests**, for each command that takes more than about 20 seconds.

- **Ask**: `<command>` takes `<time>`. Should it run after each edit, when the agent ends its turn, before each
  commit, or only in CI?
- **Decides**: the wiring of `type-check-and-build`, `run-tests-first` and `lint-with-fix-instructions`.
- **Default**: after each edit when it takes under about 20 seconds; otherwise when the turn ends. A suite of several
  minutes: the agent runs the part its change touches, and CI the whole of it.

## spend: what the loops may cost

After **autonomy**.

- **Ask**: Besides the coding agent, may other agents and checks call a model, for example a reviewer that reads each
  diff? It costs tokens, and it sends the code to the model's provider. No; yes, on your machines; yes, also in CI and
  scheduled jobs.
- **Opens**: yes → a ceiling (per change, per month), and any code that must not leave (a folder, a client's code).
- **Decides**: whether `agent-code-review`, `verification-subagent`, `approval-reviewer-agent`, `llm-evals`,
  `agent-calibration`, `triage` and `repo-health-agent` can be proposed at all.
- **Default**: no model calls in CI.

## keep: what the setup must leave alone

After **autonomy**.

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
