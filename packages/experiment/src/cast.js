// The cast of a run, ready for the loop's page: its sessions one after another, chapters marked, long waits shortened,
// the screen untouched.
//
//   node packages/experiment/src/cast.js <run dir> <out.cast>
//
// Markers come from the driver's log (task, done, CI, the person) and the transcript (each refusal of the loop's
// hooks). Time is cut only where nothing changes on screen but Claude Code's spinner: a gap longer than two seconds
// becomes two seconds, and a stretch of spinner frames plays eight times faster. No output is dropped.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { hookRefusalEvents, transcript } from './score.js';

const ANSI = /\u001b\[[0-9;?<>=]*[ -/]*[@-~]|\u001b[\]P^_][^\u0007\u001b]*(\u0007|\u001b\\)|\u001b[()][0-9A-Za-z]|\u001b[78=>DEHMc]/g;
const MAX_GAP = 2;
const SPINNER_SPEED = 8;

function readCast(file) {
  const [headerLine, ...lines] = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim());
  const header = JSON.parse(headerLine);
  if (header.version !== 3) throw new Error(`expected asciicast v3, got v${header.version}`);
  let t = 0;
  const events = [];
  for (const line of lines) {
    try {
      const [interval, code, data] = JSON.parse(line);
      t += interval;
      events.push({ t, code, data });
    } catch {
      // the last line, cut short when the recorder was stopped
    }
  }
  return { header, events };
}

/**
 * A run's recordings, one per session (session.cast, session-2.cast, …), as one recording: each later session starts
 * at its own time, on a cleared screen. Only the last session's exit is kept.
 */
function readSessions(runDir) {
  const files = ['session.cast'];
  for (let n = 2; fs.existsSync(path.join(runDir, `session-${n}.cast`)); n++) files.push(`session-${n}.cast`);
  const first = readCast(path.join(runDir, files[0]));
  const events = [];
  files.forEach((file, i) => {
    const { header, events: own } = i === 0 ? first : readCast(path.join(runDir, file));
    const last = events.at(-1)?.t ?? 0;
    const offset = i === 0 ? 0 : Math.max(header.timestamp - first.header.timestamp, last + 0.001);
    if (i > 0) events.push({ t: offset, code: 'o', data: '\u001b[2J\u001b[3J\u001b[H' });
    for (const e of own) if (e.code !== 'x' || i === files.length - 1) events.push({ ...e, t: e.t + offset });
  });
  return { header: first.header, events };
}

/**
 * A frame that changes almost nothing: Claude Code's spinner, its timer and token count, a word like "thinking". Such
 * frames come every tenth of a second while the model works, so a run of them is a wait, and plays faster.
 */
function isSpinnerFrame(event) {
  if (event.code !== 'o' || event.data.length > 200) return false;
  const visible = event.data.replace(ANSI, '').replace(/\r/g, '');
  return !visible.includes('\n') && visible.trim().length <= 40;
}

/** The run's chapters, in seconds since the recording started. */
function markers(runDir, start) {
  const out = [];
  const at = (iso) => Date.parse(iso) / 1000 - start;
  const logFile = path.join(runDir, 'driver.log');
  for (const line of fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n') : []) {
    if (!line.trim()) continue;
    const e = JSON.parse(line);
    if (e.event === 'task') out.push([at(e.t), (e.session ?? 1) > 1 ? `Session ${e.session}: the person pastes the task` : 'The person pastes the task']);
    // A turn ends with the work done, or with a question or a plan for the person: the driver does not tell them apart.
    if (e.event === 'turn-end' && e.how === 'done') out.push([at(e.t), 'The agent ends its turn']);
    if (e.event === 'ci') out.push([at(e.t), e.green ? 'CI is green' : `CI is red: ${e.failed}`]);
    if (e.event === 'watch') out.push([at(e.t), 'The person watching stops the agent']);
    if (e.event === 'permission') out.push([at(e.t), `Claude Code asks before: ${(e.command ?? 'a command').slice(0, 50)}`]);
    if (e.event === 'person') out.push([at(e.t) + 0.5, `The person: ${e.message.slice(0, 60)}${e.message.length > 60 ? '…' : ''}`]);
  }
  // The moments the experiment names (cast_markers in experiment.yaml): a tool call whose name and input match, the
  // first in each session.
  const expFile = path.resolve(runDir, '../../../experiment.yaml');
  const named = fs.existsSync(expFile) ? (parse(fs.readFileSync(expFile, 'utf8'), { merge: true }).cast_markers ?? []) : [];
  const fired = new Set();
  for (const entry of transcript(runDir)) {
    if (entry.type !== 'assistant' || !entry.timestamp) continue;
    for (const block of entry.message?.content ?? []) {
      if (block.type !== 'tool_use') continue;
      const call = `${block.name} ${JSON.stringify(block.input)}`;
      named.forEach((m, i) => {
        const key = `${entry.sessionId}:${i}`;
        if (!fired.has(key) && new RegExp(m.match).test(call)) {
          fired.add(key);
          out.push([at(entry.timestamp), m.label]);
        }
      });
    }
  }
  // Each refusal of the loop's hooks, named by when the hook runs.
  const WHEN = {
    Stop: 'The hook at the end of the turn refuses',
    PreToolUse: 'The hook before the command refuses',
    PostToolUse: 'The hook after the edit reports',
    UserPromptSubmit: 'The hook on the prompt reports',
  };
  for (const { timestamp, label, hook } of hookRefusalEvents(transcript(runDir))) {
    out.push([at(timestamp), `${WHEN[hook] ?? 'A hook of the loop refuses'}: ${label} fails`]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}

export function prepareCast(runDir, outFile) {
  const { header, events } = readSessions(runDir);
  const marks = markers(runDir, header.timestamp).map(([t, label]) => ({ t, code: 'm', data: label }));
  const all = [...events, ...marks].sort((a, b) => a.t - b.t || (a.code === 'm' ? -1 : 1));

  const lines = [JSON.stringify({ ...header, idle_time_limit: MAX_GAP })];
  let previous = 0;
  let previousWasSpinner = false;
  let typingUntil = -1;
  for (const event of all) {
    let gap = Math.max(0, event.t - previous);
    previous = event.t;
    // The person's typing, just after a marker of theirs, plays as typed.
    if (event.code === 'm' && /^The person/.test(event.data)) typingUntil = event.t + 15;
    const spinner = isSpinnerFrame(event) && event.t > typingUntil;
    if (spinner && previousWasSpinner) gap /= SPINNER_SPEED;
    previousWasSpinner = spinner || (event.code === 'm' && previousWasSpinner);
    gap = Math.min(gap, MAX_GAP);
    lines.push(JSON.stringify([Math.round(gap * 1000) / 1000, event.code, event.data]));
  }
  fs.writeFileSync(outFile, `${lines.join('\n')}\n`);
  const seconds = (file) => readCast(file).events.at(-1)?.t ?? 0;
  return { markers: marks.length, seconds_before: Math.round(events.at(-1)?.t ?? 0), seconds_after: Math.round(seconds(outFile)), bytes: fs.statSync(outFile).size };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [runDir, outFile] = process.argv.slice(2);
  console.log(JSON.stringify(prepareCast(runDir, outFile)));
}
