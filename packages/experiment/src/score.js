// The scores of one run, from what its container wrote: run.json, the transcript, the diff, the acceptance checks.
// Only programs decide here; the notes on how a run went are written separately.
//
//   node packages/experiment/src/score.js <run dir>...   prints one JSON line per run
import fs from 'node:fs';
import path from 'node:path';

/** Every JSON object in the run's transcript files (the session, and any subagent's). */
export function transcript(runDir) {
  const dir = path.join(runDir, 'transcript');
  if (!fs.existsSync(dir)) return [];
  const entries = [];
  for (const rel of fs.readdirSync(dir, { recursive: true })) {
    const file = path.join(dir, String(rel));
    if (!file.endsWith('.jsonl') || !fs.statSync(file).isFile()) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        entries.push(JSON.parse(line));
      } catch {
        // a line cut short when the session ended
      }
    }
  }
  return entries;
}

function toolUses(entries) {
  return entries
    .filter((e) => e.type === 'assistant' && Array.isArray(e.message?.content))
    .flatMap((e) => e.message.content.filter((c) => c.type === 'tool_use'));
}

/** Tokens, counting each model response once (a response is split over several transcript lines). */
function tokens(entries) {
  const byMessage = new Map();
  for (const e of entries) if (e.type === 'assistant' && e.message?.usage) byMessage.set(e.message.id ?? e.uuid, e.message.usage);
  let input = 0;
  let output = 0;
  for (const u of byMessage.values()) {
    input += (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
    output += u.output_tokens ?? 0;
  }
  return { input, output, responses: byMessage.size };
}

/**
 * Each refusal of the loop's hooks, once: Claude Code records a hook's blocking error as an entry of its own, with a
 * time. Copies of it inside later requests, and text the agent quotes or reads, do not count.
 */
export function hookRefusalEvents(entries) {
  const events = [];
  for (const e of entries) {
    if (!e.timestamp || e.type === 'assistant' || e.type === 'api-request-blob') continue;
    const content = e.message?.content;
    if (e.type === 'user' && Array.isArray(content) && content.some((c) => c.type === 'tool_result')) continue;
    const match = JSON.stringify(e).match(/sensorloop: (\w+) failed/);
    if (match) events.push({ timestamp: e.timestamp, label: match[1], hook: e.attachment?.hookEvent ?? e.hookEvent ?? null });
  }
  return events;
}

function hookRefusals(entries) {
  const byLabel = {};
  const events = hookRefusalEvents(entries);
  for (const { label } of events) byLabel[label] = (byLabel[label] ?? 0) + 1;
  return { total: events.length, ...byLabel };
}

function diffFacts(patch) {
  const added = patch.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
  const suppressions = added.filter((l) => /@ts-ignore|@ts-expect-error|@ts-nocheck|\bas any\b|:\s*any\b|<any>/.test(l));
  const files = [...patch.matchAll(/^diff --git a\/(\S+) b\/(\S+)/gm)].map((m) => m[2]);
  const deleted = [...patch.matchAll(/^diff --git a\/(\S+) b\/\S+\ndeleted file mode/gm)].map((m) => m[1]);
  return {
    files_changed: files.length,
    suppressions_added: suppressions.length,
    suppressions: suppressions.map((l) => l.slice(1).trim()).slice(0, 10),
    test_files_changed: files.filter((f) => f.startsWith('tests/')).length,
    test_files_deleted: deleted.filter((f) => f.startsWith('tests/')).length,
    lines_added: added.length,
  };
}

export function score(runDir) {
  const run = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  const entries = transcript(runDir);
  const patchFile = path.join(runDir, 'diff.patch');
  const patch = fs.existsSync(patchFile) ? fs.readFileSync(patchFile, 'utf8') : '';
  const commands = toolUses(entries).filter((t) => t.name === 'Bash').map((t) => String(t.input?.command ?? ''));
  const greenRound = run.rounds.find((r) => r.ci?.green);
  const first = run.rounds[0]?.ci;
  const castFile = path.join(runDir, 'session.cast');
  const apiErrors = entries.filter((e) => e.isApiErrorMessage || (e.type === 'assistant' && /^API Error/.test(e.message?.content?.[0]?.text ?? '')));
  return {
    run: run.run,
    arm: run.arm,
    model: run.model,
    ended: run.ended ?? null,
    error: run.error ? run.error.split('\n')[0] : null,
    // verdicts
    ci_green_at_first_done: first ? first.green : null,
    first_red_step: first && !first.green ? first.failed : null,
    final_ci_green: run.rounds.length ? run.rounds[run.rounds.length - 1].ci.green : null,
    acceptance_pass: run.acceptance?.pass ?? null,
    acceptance: run.acceptance ? `${run.acceptance.passed}/${run.acceptance.total}` : null,
    checks: run.acceptance?.checks ?? null,
    values: run.acceptance?.values ?? null,
    // The first hand-over: the work at the agent's first "done" with a change, before anyone said anything about it.
    first: run.acceptance_first
      ? {
          acceptance: `${run.acceptance_first.passed}/${run.acceptance_first.total}`,
          checks: run.acceptance_first.checks ?? null,
          values: run.acceptance_first.values ?? null,
          same_as_final: Boolean(run.acceptance_first.same_as_final),
        }
      : null,
    later_dones: run.first_handover?.later_dones ?? null,
    permission_asks: (run.permission_asks ?? []).length,
    interrupts: (run.interrupts ?? []).length,
    sessions: (run.sessions ?? []).length || 1,
    // counts
    person_reports: (run.reports ?? 0) + (run.nudges ?? 0),
    nudges: run.nudges ?? 0,
    hook_refusals: hookRefusals(entries),
    agent_type_checks: commands.filter((c) => /\btsc\b|typecheck/.test(c)).length,
    agent_builds: commands.filter((c) => /run (-s )?build/.test(c)).length,
    agent_test_runs: commands.filter((c) => /vitest|npm (run )?test|npm t\b/.test(c)).length,
    ...diffFacts(patch),
    tokens: tokens(entries),
    tool_calls: toolUses(entries).length,
    api_errors: apiErrors.length,
    minutes: run.minutes,
    minutes_to_green: greenRound && run.task_at ? Math.round((Date.parse(greenRound.at) - Date.parse(run.task_at)) / 600) / 100 : null,
    cast_bytes: fs.existsSync(castFile) ? fs.statSync(castFile).size : null,
    claude_code: run.claude_code,
    image: run.image,
    plugin_commit: run.plugin_commit,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const dir of process.argv.slice(2)) console.log(JSON.stringify(score(dir)));
}
