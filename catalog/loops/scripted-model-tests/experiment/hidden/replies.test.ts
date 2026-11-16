// The judge's tests of the code around the model: categorizeLines against a scripted fake, on replies that
// deepseek-flash really gives through its Anthropic-compatible API (seen while building this experiment): a thinking
// block before the answer, a reply cut off at max_tokens while thinking (only a thinking block) or inside the tool call
// (input {}), and replies with no tool call. No network. Copied into the project's tests/ only after the session.
import { describe, expect, it } from 'vitest';
import * as categorize from '../src/categorize/categorize.js';

const LINES = ['Receipt printer', 'Installation of the printer', 'Hotel, 2 nights'];
const EXPECTED = ['Hardware', 'Consulting', 'Rebilled expenses'];
const MAX_REQUESTS = 3;

type Block = Record<string, unknown>;
interface Request {
  tools?: { name: string; input_schema?: { properties?: Record<string, { type?: string }> } }[];
  tool_choice?: { type: string; name?: string };
  thinking?: { type: string };
}

/** The name of the tool the code offers, and the name of its list argument (categories, as the issue asks). */
function toolOf(request: Request): { name: string; arg: string } {
  const tool = request.tools?.[0];
  const props = tool?.input_schema?.properties ?? {};
  const arg = 'categories' in props ? 'categories' : Object.keys(props).find((k) => props[k]?.type === 'array') ?? 'categories';
  return { name: tool?.name ?? 'save_categories', arg };
}

const thinking = (): Block => ({ type: 'thinking', thinking: 'The lines: a printer, its installation, a hotel.', signature: 'sig' });
const text = (t: string): Block => ({ type: 'text', text: t, citations: null });
const call = (name: string, input: unknown): Block => ({ type: 'tool_use', id: 'call_00_judge', name, input });

function message(content: Block[], stop_reason: string) {
  return {
    id: 'msg_judge',
    type: 'message',
    role: 'assistant',
    model: 'deepseek-flash',
    content,
    stop_reason,
    stop_sequence: null,
    usage: { input_tokens: 700, output_tokens: 90, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  };
}

/** A fake client: the first reply is built by `first` from the request; any later one is a plain, valid tool call. */
function fake(first: (tool: { name: string; arg: string }) => unknown) {
  const requests: Request[] = [];
  return {
    requests,
    messages: {
      async create(params: Request) {
        requests.push(params);
        if (requests.length > MAX_REQUESTS) throw new Error(`judge fake: more than ${MAX_REQUESTS} requests for one invoice`);
        const tool = toolOf(params);
        return requests.length === 1 ? first(tool) : message([call(tool.name, { [tool.arg]: EXPECTED })], 'tool_use');
      },
    },
  };
}

/** A valid reply: the code must return the categories in it. */
async function mustUse(first: (tool: { name: string; arg: string }) => unknown) {
  const client = fake(first);
  const got = await categorize.categorizeLines(LINES, client as never);
  expect(got).toEqual(EXPECTED);
}

/**
 * An unusable reply: the code may ask again and use the next reply, or fail with CategorizeError; nothing else.
 * With mayUse, it may also make the right categories out of the reply itself.
 */
async function mustRefuseOrRetry(first: (tool: { name: string; arg: string }) => unknown, { mayUse = false } = {}) {
  const client = fake(first);
  let outcome: unknown;
  try {
    outcome = await categorize.categorizeLines(LINES, client as never);
  } catch (error) {
    if (error instanceof categorize.CategorizeError) return;
    throw new Error(`threw ${(error as Error)?.constructor?.name}: ${(error as Error)?.message}`);
  }
  expect(outcome, 'returned categories from an unusable reply').toEqual(EXPECTED);
  if (!mayUse) expect(client.requests.length, 'used the reply it asked again for').toBeGreaterThan(1);
}

describe('categorizeLines', () => {
  it('plain tool call', () => mustUse((t) => message([call(t.name, { [t.arg]: EXPECTED })], 'tool_use')));

  it('reply: thinking before the tool call', () =>
    mustUse((t) => message([thinking(), call(t.name, { [t.arg]: EXPECTED })], 'tool_use')));

  it('reply: text before the tool call', () =>
    mustUse((t) => message([thinking(), text("I'll save the categories."), call(t.name, { [t.arg]: EXPECTED })], 'tool_use')));

  it('reply: cut off while thinking', () => mustRefuseOrRetry(() => message([thinking()], 'max_tokens')));

  it('reply: cut off inside the tool call', () => mustRefuseOrRetry((t) => message([call(t.name, {})], 'max_tokens')));

  it('reply: text and no tool call', () =>
    mustRefuseOrRetry(() => message([thinking(), text('Line 1 is Hardware, line 2 Consulting, line 3 Rebilled expenses.')], 'end_turn')));

  it('reply: refusal', () => mustRefuseOrRetry(() => message([], 'refusal')));

  it('reply: categories as a string', () =>
    mustRefuseOrRetry((t) => message([call(t.name, { [t.arg]: JSON.stringify(EXPECTED) })], 'tool_use'), { mayUse: true }));

  it('reply: unknown category', () =>
    mustRefuseOrRetry((t) => message([call(t.name, { [t.arg]: ['Hardware', 'Services', 'Rebilled expenses'] })], 'tool_use')));

  it('reply: fewer categories than lines', () =>
    mustRefuseOrRetry((t) => message([call(t.name, { [t.arg]: ['Hardware'] })], 'tool_use')));

  it('request the provider accepts', async () => {
    const client = fake((t) => message([call(t.name, { [t.arg]: EXPECTED })], 'tool_use'));
    await categorize.categorizeLines(LINES, client as never).catch(() => undefined);
    const first = client.requests[0];
    expect(first, 'no request was sent').toBeDefined();
    const forced = first.tool_choice && ['tool', 'any'].includes(first.tool_choice.type);
    // DeepSeek answers 400 "Thinking mode does not support this tool_choice" unless thinking is disabled.
    expect(forced && first.thinking?.type !== 'disabled', `tool_choice ${first.tool_choice?.type} with thinking on`).toBeFalsy();
  });

  it('offers the save_categories tool', async () => {
    const client = fake((t) => message([call(t.name, { [t.arg]: EXPECTED })], 'tool_use'));
    await categorize.categorizeLines(LINES, client as never).catch(() => undefined);
    expect(client.requests[0]?.tools?.map((t) => t.name) ?? [], 'tools offered').toContain('save_categories');
  });
});
