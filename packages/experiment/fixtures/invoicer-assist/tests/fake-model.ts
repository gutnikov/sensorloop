// A fake of the model's client for tests: it replays scripted replies in order and keeps every request it gets.
// No network and no key: a request with no reply left fails the test.
import type Anthropic from '@anthropic-ai/sdk';
import type { ModelClient } from '../src/categorize/categorize.js';

export interface FakeModel extends ModelClient {
  requests: Anthropic.MessageCreateParamsNonStreaming[];
  /** Replies scripted but never asked for. */
  unused(): number;
}

export function fakeModel(...replies: Anthropic.Message[]): FakeModel {
  const queue = [...replies];
  const requests: Anthropic.MessageCreateParamsNonStreaming[] = [];
  return {
    requests,
    unused: () => queue.length,
    messages: {
      async create(params) {
        requests.push(params);
        const reply = queue.shift();
        if (!reply) throw new Error(`fake model: no reply scripted for request ${requests.length}`);
        return reply;
      },
    },
  };
}

/** A reply of one text block, as the model gives when it is done. */
export function textReply(text: string): Anthropic.Message {
  return {
    id: 'msg_fake',
    type: 'message',
    role: 'assistant',
    model: 'deepseek-flash',
    content: [{ type: 'text', text, citations: null }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 900,
      output_tokens: 120,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      server_tool_use: null,
      service_tier: null,
    },
  } as Anthropic.Message;
}

/** The answer the prompt asks for: notes, then the categories in a json block. */
export function answer(categories: string[], notes = 'Notes on each line.'): string {
  return `${notes}\n\n\`\`\`json\n${JSON.stringify(categories)}\n\`\`\``;
}
