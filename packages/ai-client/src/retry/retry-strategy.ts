import { type Result, type AnimationPlan, err } from '@svg-spawn/core';
import type { AiClient } from '../gemini/client.js';
import { AiError } from '../errors.js';
import { buildRetryPrompt } from '../prompts/retry-prompt.js';

export interface RetryConfig {
  maxAttempts: number; // default 3
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
};

/**
 * Calls the AI client with retry logic on validation failures.
 *
 * On success, returns immediately.
 * On validation failure, builds a retry prompt with errors and tries again.
 * After maxAttempts, returns the last error.
 */
export async function generateWithRetry(
  client: AiClient,
  systemPrompt: string,
  userPrompt: string,
  validate: (response: string) => Result<AnimationPlan, AiError>,
  config?: RetryConfig,
): Promise<Result<AnimationPlan, AiError>> {
  const { maxAttempts } = config ?? DEFAULT_RETRY_CONFIG;

  let lastError: AiError = new AiError('No attempts made', 'unknown');
  let currentPrompt = userPrompt;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const aiResult = await client.generateContent(currentPrompt, systemPrompt);

    if (!aiResult.ok) {
      return aiResult;
    }

    const responseText = aiResult.value;
    const validationResult = validate(responseText);

    if (validationResult.ok) {
      return validationResult;
    }

    lastError = validationResult.error;

    // Build retry prompt for next attempt
    currentPrompt = buildRetryPrompt(responseText, [lastError.message]);
  }

  return err(lastError);
}
