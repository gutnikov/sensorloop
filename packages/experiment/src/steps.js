// A run's session as numbered steps, the numbering a result's notes cite ("arm A, run 1, step 27"): each tool call the
// agent makes is one step, and so is each text it writes; what the person or a hook says is printed between them,
// unnumbered.
//
//   node packages/experiment/src/steps.js <run dir> [--full]
//
// <run dir> is a run's folder (runs/<label>/<arm>-<model>-<n>); its transcript is the session's main transcript.
// Without --full a tool call's input and a tool's result are cut to one line.
import fs from 'node:fs';
import path from 'node:path';

/** The session's main transcript: the largest .jsonl under transcript/, leaving out subagents' files. */
export function mainTranscript(runDir) {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'subagents') walk(p);
      } else if (entry.name.endsWith('.jsonl')) files.push(p);
    }
  };
  const root = path.join(runDir, 'transcript');
  if (fs.existsSync(root)) walk(root);
  files.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
  return files[0] ?? null;
}

/** The steps of a transcript: [{n, kind: 'tool'|'text'|'person'|'hook'|'result', text, at}], n only on the agent's. */
export function steps(file) {
  const out = [];
  let n = 0;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (e.isSidechain) continue;
    const content = e.message?.content;
    if (e.type === 'assistant') {
      for (const c of content ?? []) {
        if (c.type === 'tool_use') out.push({ n: ++n, kind: 'tool', text: `${c.name} ${JSON.stringify(c.input)}`, at: e.timestamp });
        else if (c.type === 'text' && c.text.trim()) out.push({ n: ++n, kind: 'text', text: c.text.trim(), at: e.timestamp });
      }
    } else if (e.type === 'user') {
      if (typeof content === 'string') {
        out.push({ kind: /sensorloop(?: [\w-]+)?: |hook/i.test(content) && e.isMeta ? 'hook' : 'person', text: content, at: e.timestamp });
      } else if (Array.isArray(content)) {
        for (const c of content) {
          if (c.type === 'text' && c.text.trim()) out.push({ kind: e.isMeta ? 'hook' : 'person', text: c.text.trim(), at: e.timestamp });
          if (c.type === 'tool_result') {
            const text = Array.isArray(c.content) ? c.content.map((x) => x.text ?? '').join('\n') : String(c.content ?? '');
            out.push({ kind: 'result', text, at: e.timestamp });
          }
        }
      }
    } else if (e.type === 'attachment' || e.type === 'system') {
      const s = JSON.stringify(e);
      const m = s.match(/sensorloop(?: [\w-]+)?: [^"\\]{0,300}/);
      if (m) out.push({ kind: 'hook', text: m[0], at: e.timestamp });
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [runDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const full = process.argv.includes('--full');
  const file = runDir && mainTranscript(runDir);
  if (!file) {
    console.error('usage: node packages/experiment/src/steps.js <run dir> [--full]   (no transcript found)');
    process.exit(2);
  }
  const one = (s, max) => (full ? s : s.replace(/\s+/g, ' ').slice(0, max));
  for (const s of steps(file)) {
    if (s.kind === 'tool') console.log(`[${s.n}] ${one(s.text, 240)}`);
    else if (s.kind === 'text') console.log(`[${s.n}] says: ${full ? s.text : s.text.replace(/\s+/g, ' ')}`);
    else if (s.kind === 'result') console.log(`      -> ${one(s.text, 160)}`);
    else console.log(`   (${s.kind}) ${one(s.text, 400)}`);
  }
}
