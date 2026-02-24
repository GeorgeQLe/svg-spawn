export { AiError } from './errors.js';
export type { AiErrorCode } from './errors.js';

export { GeminiClient, MockAiClient } from './gemini/client.js';
export type { AiClient } from './gemini/client.js';

export { buildSystemPrompt } from './prompts/system-prompt.js';
export { buildGenerationPrompt } from './prompts/generation-prompt.js';
export { buildChainingPrompt } from './prompts/chaining-prompt.js';
export { buildRetryPrompt } from './prompts/retry-prompt.js';

export { parseAiResponse } from './response/parse-response.js';
export { validateAiResponse } from './response/validate-response.js';

export { generateWithRetry } from './retry/retry-strategy.js';
export type { RetryConfig } from './retry/retry-strategy.js';

export { estimateTokens } from './budget/estimate-tokens.js';
export { shouldIncludeRawSvg } from './budget/truncate-svg.js';

export { generateAnimationPlan } from './generate.js';
export type { GenerateOptions } from './generate.js';
