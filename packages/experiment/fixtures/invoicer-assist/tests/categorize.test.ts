import { describe, expect, it } from 'vitest';
import { CategorizeError, categorizeInvoices, categorizeLines, parseAnswer } from '../src/categorize/categorize.js';
import { SYSTEM_PROMPT } from '../src/categorize/prompt.js';
import type { Invoice } from '../src/types.js';
import { answer, fakeModel, textReply } from './fake-model.js';

function invoice(id: string, ...descriptions: string[]): Invoice {
  return {
    id,
    customer: { id: 'acme', name: 'Acme Tools' },
    issuedOn: '2026-10-01',
    dueOn: '2026-10-31',
    items: descriptions.map((description) => ({ description, quantity: 1, unitPrice: 100 })),
    taxRate: 0.2,
    paid: false,
  };
}

describe('categorizeLines', () => {
  it('puts each line in the category the model answers', async () => {
    const model = fakeModel(textReply(answer(['Hardware', 'Consulting'])));
    const categories = await categorizeLines(['Receipt printer', 'Installation of the printer'], model);
    expect(categories).toEqual(['Hardware', 'Consulting']);
    expect(model.unused()).toBe(0);
  });

  it('sends the prompt as the system message and the lines numbered', async () => {
    const model = fakeModel(textReply(answer(['Software'])));
    await categorizeLines(['Route planner licence, 12 months'], model);
    expect(model.requests).toHaveLength(1);
    expect(model.requests[0].system).toBe(SYSTEM_PROMPT);
    expect(model.requests[0].messages).toEqual([
      { role: 'user', content: 'The lines of the invoice:\n\n1. Route planner licence, 12 months' },
    ]);
  });

  it('refuses a category it does not know', async () => {
    const model = fakeModel(textReply(answer(['Services'])));
    await expect(categorizeLines(['Data migration'], model)).rejects.toThrow(CategorizeError);
  });

  it('refuses an answer with fewer categories than lines', async () => {
    const model = fakeModel(textReply(answer(['Hardware'])));
    await expect(categorizeLines(['Receipt printer', 'Hotel, 2 nights'], model)).rejects.toThrow(/expected 2 categories/);
  });

  it('refuses an answer with no JSON list', async () => {
    const model = fakeModel(textReply('Line 1 is a printer, so Hardware.'));
    await expect(categorizeLines(['Receipt printer'], model)).rejects.toThrow(/no JSON list/);
  });
});

describe('parseAnswer', () => {
  it('takes the last json block when the notes hold another list', () => {
    const text = `Notes: candidates were ["Hardware", "Support"].\n\n\`\`\`json\n["Support"]\n\`\`\``;
    expect(parseAnswer(text, 1)).toEqual(['Support']);
  });

  it('takes a bare JSON list when there is no block', () => {
    expect(parseAnswer('["Training", "Rebilled expenses"]', 2)).toEqual(['Training', 'Rebilled expenses']);
  });
});

describe('categorizeInvoices', () => {
  it('keeps the order of the file, one request per invoice', async () => {
    const model = fakeModel(textReply(answer(['Hardware', 'Rebilled expenses'])), textReply(answer(['Training'])));
    const lines = await categorizeInvoices([invoice('INV-1', 'Receipt printer', 'Courier'), invoice('INV-2', 'Onboarding session')], model);
    expect(lines).toEqual([
      { invoice: 'INV-1', line: 'Receipt printer', category: 'Hardware' },
      { invoice: 'INV-1', line: 'Courier', category: 'Rebilled expenses' },
      { invoice: 'INV-2', line: 'Onboarding session', category: 'Training' },
    ]);
    expect(model.requests).toHaveLength(2);
  });

  it('names the invoice whose answer it could not use', async () => {
    const model = fakeModel(textReply(answer(['Gadgets'])));
    await expect(categorizeInvoices([invoice('INV-7', 'Scanner')], model)).rejects.toThrow(/invoice INV-7: unknown category/);
  });
});
