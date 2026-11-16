#!/usr/bin/env node
// sensorloop: the guards of the coding agents in CI (loop agent-ci-hardening). Reads every workflow in
// .github/workflows, finds each job that runs a coding agent, and checks the guards the loop's card names. Prints one
// line per problem, naming the workflow, the job and the fix, and each exemption with its reason; exits 1 on a problem.
//
//   node .sensorloop/hooks/agent-ci.mjs     (run by check.sh before each commit and when the agent ends its turn)
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const dir = path.join(root, '.github', 'workflows');

// The repository's agent jobs, as `<workflow file> <job id>`. Finding fewer than these fails: a check that stopped
// recognising a job would otherwise report nothing to check as a pass. A person adds a new agent job here.
const AGENT_JOBS = [];
// Exemptions, each for one rule of one job, with its reason; a person reviews each, and every run prints it.
// { workflow: 'agent.yml', job: 'draft', rule: 'network', reason: '...' }
const EXEMPT = [];

// Triggers whose event carries text anyone can write.
const UNTRUSTED = ['issues', 'issue_comment', 'pull_request_target', 'pull_request_review', 'pull_request_review_comment',
  'discussion', 'discussion_comment'];
// That text, pasted into a step's command or inputs.
const UNTRUSTED_TEXT = /\$\{\{[^}]*(github\.event\.(issue|comment|review|review_comment|pull_request|discussion)\.(title|body)|github\.event\.pull_request\.head\.(ref|label)|github\.head_ref|toJSON\(\s*github\.event)[^}]*\}\}/;

const text = (v) => (v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v));
const stepText = (s) => [text(s.run), ...Object.values(s.with ?? {}).map(text)].join('\n');
const stepName = (s) => s.name ?? s.uses ?? text(s.run).split('\n')[0].slice(0, 50);

// A coding agent, by more than one pattern: Claude Code's action, its sign-in inputs spelled with `_` or `-`, its key in
// the step's environment, or its command line.
const isAgent = (s) => /^anthropics\/claude-code(-base)?-action@/.test(text(s.uses))
  || Object.keys(s.with ?? {}).some((k) => /^(anthropic[_-]api[_-]key|claude[_-]code[_-]oauth[_-]token)$/i.test(k))
  || /ANTHROPIC_API_KEY|CLAUDE_CODE_OAUTH_TOKEN/.test(text(s.env))
  || /(^|[\s;&|(])(claude|npx\s+(-y\s+|--yes\s+)?@anthropic-ai\/claude-code\S*)\s[^\n]*(-p\b|--print\b)|\|\s*claude\b/m.test(text(s.run));

function triggers(doc) {
  const on = doc.on ?? doc[true];
  if (typeof on === 'string') return [on];
  if (Array.isArray(on)) return on;
  return Object.keys(on ?? {});
}
function flagValue(t, names) {
  const m = t.match(new RegExp(`(?:${names})(?:=|\\s+)("([^"]*)"|'([^']*)'|(\\S+))`));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '').trim() : null;
}
function toolList(s) {
  const lists = [s.with?.allowed_tools, s.with?.['allowed-tools'], flagValue(stepText(s), '--allowedTools|--allowed-tools|--allowed_tools')];
  return lists.filter((l) => l != null && String(l).trim()).join(',')
    .split(/,(?![^(]*\))|\s+(?![^(]*\))/).map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

const problems = [];
const exempted = [];
const found = [];
function problem(workflow, job, rule, message) {
  const exemption = EXEMPT.find((e) => e.workflow === workflow && e.job === job && e.rule === rule);
  if (exemption) exempted.push(`${workflow} job ${job}: exempt from ${rule}: ${exemption.reason}`);
  else problems.push(`${workflow} job ${job}: ${message}`);
}

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort() : [];
for (const file of files) {
  let doc;
  try {
    doc = YAML.parse(fs.readFileSync(path.join(dir, file), 'utf8')) ?? {};
  } catch (error) {
    problems.push(`${file}: does not parse: ${error.message.split('\n')[0]}`);
    continue;
  }
  const untrusted = triggers(doc).filter((t) => UNTRUSTED.includes(t));

  for (const [id, job] of Object.entries(doc.jobs ?? {})) {
    const steps = job?.steps ?? [];
    // Every third-party step is pinned to a commit, in every job; GitHub's own actions may keep a tag.
    for (const s of steps) {
      const uses = text(s.uses);
      if (uses && !uses.startsWith('./') && !uses.startsWith('docker://') && !/^(actions|github)\//.test(uses) && !/@[0-9a-f]{40}$/.test(uses)) {
        problem(file, id, 'pinned', `'${uses}' is not pinned: use the full commit SHA of the release, with the tag in a comment ('uses: owner/action@<40-hex sha> # v1.2.3').`);
      }
    }
    const agents = steps.filter(isAgent);
    if (!agents.length) continue;
    found.push(`${file} ${id}`);
    const all = steps.map((s) => `${stepText(s)}\n${text(s.env)}`).join('\n') + text(job.env);

    // The network is filtered: harden-runner first, in block mode, with an allow list of full host names.
    const harden = steps.find((s) => /^step-security\/harden-runner@/.test(text(s.uses)));
    const hosts = text(harden?.with?.['allowed-endpoints']).trim();
    if (!harden) problem(file, id, 'network', "outbound traffic is not filtered: add 'step-security/harden-runner' (pinned) as the job's first step, with 'egress-policy: block' and 'allowed-endpoints' naming each host in full (api.anthropic.com:443, github.com:443, ...).");
    else if (text(harden.with?.['egress-policy']) !== 'block') problem(file, id, 'network', "harden-runner only audits: set 'egress-policy: block'.");
    else if (!hosts) problem(file, id, 'network', "harden-runner's 'allowed-endpoints' is empty: list each host the job needs, in full.");
    else if (hosts.includes('*')) problem(file, id, 'network', "harden-runner's 'allowed-endpoints' names a host with '*': name each host in full.");

    // Permission checks stay on.
    if (/--dangerously-skip-permissions|allow[_-]?dangerously[_-]?skip|bypassPermissions/i.test(all)) problem(file, id, 'permissions', "turns permission checks off: remove '--dangerously-skip-permissions' / 'bypassPermissions'.");
    if (/["']?defaultMode["']?\s*[:=]/.test(all)) problem(file, id, 'permissions', "sets a default permission mode (defaultMode): remove it; each agent step sets '--permission-mode auto' itself.");
    for (const s of agents) {
      const t = stepText(s);
      const mode = flagValue(t, '--permission-mode');
      if (mode !== 'auto') problem(file, id, 'permissions', `step '${stepName(s)}' ${mode ? `sets --permission-mode ${mode}` : 'sets no permission mode'}: add '--permission-mode auto' to its command line or to 'claude_args' under its 'with:'.`);
      const tools = toolList(s);
      if (!tools.length || tools.includes('*')) problem(file, id, 'tools', `step '${stepName(s)}' has no tool allow list: add '--allowedTools "<only the tools it needs>"' (for example "Read,Grep,Glob,Edit,Write,Bash(npm test)").`);
      else if (tools.some((x) => /^Bash(\((\*|:\*|\s*)\))?$/.test(x)) && tools.some((x) => /^(Edit|Write|MultiEdit)$/.test(x))) problem(file, id, 'tools', `step '${stepName(s)}' allows any shell command and file writes: list the commands it needs, such as 'Bash(npm test)'.`);
      if (!(s.with?.max_turns ?? s.with?.['max-turns']) && !/--max-turns(=|\s+)\d+/.test(t)) problem(file, id, 'turns', `step '${stepName(s)}' has no turn cap: add '--max-turns <n>' (for example 30).`);
    }

    // Text anyone can write meets no write token.
    if (untrusted.length) {
      const on = untrusted.join(', ');
      const perms = job.permissions ?? doc.permissions;
      if (perms == null) problem(file, id, 'token', `reads text anyone can write (${on}) with the default token: give the job 'permissions: { contents: read }', and open the pull request from a separate job that has only the write scope it needs.`);
      else if (typeof perms === 'string' && perms !== 'read-all') problem(file, id, 'token', `reads text anyone can write (${on}) with 'permissions: ${perms}': give the job 'contents: read' only.`);
      else if (typeof perms === 'object') {
        const writes = Object.entries(perms).filter(([k, v]) => v === 'write' && k !== 'id-token').map(([k]) => k);
        if (writes.length) problem(file, id, 'token', `reads text anyone can write (${on}) with a token that writes ${writes.join(', ')}: keep this job read-only, and move the push and the pull request to a separate job that gets the agent's change as an artifact and has only the write scope it needs.`);
        if (perms['id-token'] === 'write' && agents.some((s) => /^anthropics\/claude-code/.test(text(s.uses)))) problem(file, id, 'token', "'id-token: write' lets the action sign in as its GitHub app, which writes: remove it from the job that reads the issue.");
      }
      for (const s of agents) {
        const tokens = [...`${text(s.with)} ${text(s.env)}`.matchAll(/secrets\.(\w+)|github\.token/g)].map((m) => m[1] ?? 'github.token')
          .filter((n) => !/^(ANTHROPIC_API_KEY|CLAUDE_CODE_OAUTH_TOKEN)$/.test(n));
        if (tokens.length) problem(file, id, 'token', `step '${stepName(s)}' gets ${tokens.join(', ')}: the agent's step holds no token but the model's key.`);
      }
      for (const s of steps.filter((x) => /^actions\/checkout@/.test(text(x.uses)) && String(x.with?.['persist-credentials']) !== 'false')) {
        problem(file, id, 'checkout', `'${text(s.uses)}' keeps its credentials for later steps: add 'persist-credentials: false' under its 'with:'.`);
      }
      if (triggers(doc).includes('pull_request_target') && !/head\.repo\.full_name\s*==\s*github\.repository|github\.repository\s*==\s*github\.event\.pull_request\.head\.repo\.full_name/.test(text(job.if))) {
        problem(file, id, 'fork', "runs on pull_request_target for any fork: add 'if: github.event.pull_request.head.repo.full_name == github.repository'.");
      }
    }
  }
  // That text reaches no prompt or command, in any job of the workflow: pass it in 'env:' and write it to a file.
  for (const [id, job] of Object.entries(doc.jobs ?? {})) {
    for (const s of job?.steps ?? []) {
      const m = stepText(s).match(UNTRUSTED_TEXT);
      if (m) problem(file, id, 'injection', `step '${stepName(s)}' pastes ${m[0]} into a command or prompt: pass it through 'env:' and write it to a file the agent reads.`);
    }
  }
}

const missing = AGENT_JOBS.filter((j) => !found.includes(j));
if (missing.length) problems.push(`agent jobs listed but not found: ${missing.join(', ')} (the check no longer recognises them, or they were removed: tell the person).`);
const added = found.filter((j) => !AGENT_JOBS.includes(j));

console.log(`agent jobs: ${found.length ? found.join(', ') : 'none'}${added.length ? ` (not yet on the list, for a person to add: ${added.join(', ')})` : ''}`);
for (const line of exempted) console.log(`exempt: ${line}`);
for (const line of problems) console.log(`problem: ${line}`);
if (problems.length) {
  console.log(`${problems.length} problem(s). Put each guard back as its line says; do not skip or weaken the check. A job that cannot meet a rule goes to a person, who may add an exemption with a reason.`);
  process.exit(1);
}
