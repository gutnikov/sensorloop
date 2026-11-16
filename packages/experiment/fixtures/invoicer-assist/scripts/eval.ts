// The eval set of `invoicer categorize`: runs every case of evals/categorize.jsonl against the real model, a few times
// each, and prints the cases that failed and the pass rate. It calls the model, so it needs the API settings (README)
// and costs money: nothing runs it automatically.
//
//   npm run eval                 every case, 3 runs each
//   npm run eval -- --runs 1     every case once
import { readFileSync } from 'node:fs';
import { CategorizeError, categorizeLines } from '../src/categorize/categorize.js';

interface Case {
  id: string;
  lines: string[];
  expected: string[];
}

const at = process.argv.indexOf('--runs');
const runs = at >= 0 ? Number(process.argv[at + 1]) : 3;
const cases: Case[] = readFileSync(new URL('../evals/categorize.jsonl', import.meta.url), 'utf8')
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line));

/** One run of one case: null when it passed, what went wrong, or an error of the API (not counted). */
async function attempt(c: Case): Promise<string | null | Error> {
  try {
    const got = await categorizeLines(c.lines);
    const wrong = c.lines.flatMap((line, i) => (got[i] === c.expected[i] ? [] : [`"${line}": ${got[i]}, expected ${c.expected[i]}`]));
    return wrong.length ? wrong.join('; ') : null;
  } catch (error) {
    if (error instanceof CategorizeError) return error.message;
    return error as Error;
  }
}

const jobs = cases.flatMap((c) => Array.from({ length: runs }, () => c));
const results = new Map<string, (string | null)[]>(cases.map((c) => [c.id, []]));
const errors: string[] = [];
let next = 0;
async function worker(): Promise<void> {
  while (next < jobs.length) {
    const c = jobs[next++];
    const outcome = await attempt(c);
    if (outcome instanceof Error) errors.push(`${c.id}: ${outcome.message}`);
    else results.get(c.id)!.push(outcome);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

let passed = 0;
for (const c of cases) {
  const outcomes = results.get(c.id)!;
  const ok = outcomes.filter((o) => o === null).length;
  passed += ok;
  if (ok < outcomes.length) {
    const problems = [...new Set(outcomes.filter((o) => o !== null))];
    console.log(`${c.id}: passed ${ok}/${outcomes.length}: ${problems.join(' | ')}`);
  }
}
for (const error of errors) console.log(`not counted, the API failed: ${error}`);
const total = cases.length * runs - errors.length;
console.log(`pass rate ${Math.round((100 * passed) / total)}% (${passed}/${total} runs: ${cases.length} cases, ${runs} runs each)`);
