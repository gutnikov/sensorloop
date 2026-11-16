import Anthropic from '@anthropic-ai/sdk';
import type { Invoice } from '../types.js';
import { type Category, isCategory } from './categories.js';
import { linesMessage, SYSTEM_PROMPT } from './prompt.js';
import { settings } from './settings.js';

/** What categorize needs of the model's client: the Messages API. Tests pass a fake that replays scripted replies. */
export interface ModelClient {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
  };
}

/** The model's answer could not be used. Reported to the user as it is. */
export class CategorizeError extends Error {}

export interface CategorizedLine {
  invoice: string;
  line: string;
  category: Category;
}

export function defaultClient(): ModelClient {
  return new Anthropic();
}

/** The category of each line, in the order of the lines. One request to the model. */
export async function categorizeLines(lines: string[], client: ModelClient = defaultClient()): Promise<Category[]> {
  const reply = await client.messages.create({
    model: settings.model,
    max_tokens: settings.maxTokens,
    temperature: settings.temperature,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: linesMessage(lines) }],
  });
  if (reply.stop_reason === 'max_tokens') {
    throw new CategorizeError(`the answer was cut off at ${settings.maxTokens} tokens`);
  }
  const text = reply.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('\n');
  return parseAnswer(text, lines.length);
}

/** The categories in the model's answer: its last ```json block, or else its last JSON list. */
export function parseAnswer(text: string, count: number): Category[] {
  const fenced = [...text.matchAll(/```json\s*([\s\S]*?)```/g)].at(-1)?.[1];
  const json = fenced ?? text.slice(text.lastIndexOf('['), text.lastIndexOf(']') + 1);
  let list: unknown;
  try {
    list = JSON.parse(json);
  } catch {
    throw new CategorizeError(`no JSON list of categories in the answer: ${excerpt(text)}`);
  }
  if (!Array.isArray(list)) throw new CategorizeError(`the answer's JSON is not a list: ${excerpt(json)}`);
  if (list.length !== count) throw new CategorizeError(`expected ${count} categories, the answer has ${list.length}`);
  const unknown = list.find((category) => !isCategory(category));
  if (unknown !== undefined) throw new CategorizeError(`unknown category in the answer: ${JSON.stringify(unknown)}`);
  return list as Category[];
}

/** Every line of every invoice with its category, in the file's order. Invoices go to the model a few at a time. */
export async function categorizeInvoices(invoices: Invoice[], client: ModelClient = defaultClient()): Promise<CategorizedLine[]> {
  const results: CategorizedLine[][] = new Array(invoices.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < invoices.length) {
      const i = next++;
      const invoice = invoices[i];
      const lines = invoice.items.map((item) => item.description);
      let categories: Category[];
      try {
        categories = await categorizeLines(lines, client);
      } catch (error) {
        if (error instanceof CategorizeError) throw new CategorizeError(`invoice ${invoice.id}: ${error.message}`);
        throw error;
      }
      results[i] = lines.map((line, j) => ({ invoice: invoice.id, line, category: categories[j] }));
    }
  }
  await Promise.all(Array.from({ length: Math.min(settings.concurrency, invoices.length) }, worker));
  return results.flat();
}

function excerpt(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 120 ? `${flat.slice(0, 117)}...` : flat || '(empty)';
}
