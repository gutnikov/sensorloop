/**
 * How `invoicer categorize` calls the model. DeepSeek, through its Anthropic-compatible API: the client takes
 * ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN from the environment (see the README).
 */
export const settings = {
  model: 'deepseek-flash',
  maxTokens: 4096,
  temperature: 0,
  /** Invoices sent to the model at the same time. */
  concurrency: 4,
};
