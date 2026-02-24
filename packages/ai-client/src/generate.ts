import {
  type Result,
  type AnimationPlan,
  type SvgStructuredSummary,
} from '@svg-spawn/core';
import type { AiClient } from './gemini/client.js';
import { AiError } from './errors.js';
import { buildSystemPrompt } from './prompts/system-prompt.js';
import { buildGenerationPrompt } from './prompts/generation-prompt.js';
import { buildChainingPrompt } from './prompts/chaining-prompt.js';
import { parseAiResponse } from './response/parse-response.js';
import { validateAiResponse } from './response/validate-response.js';
import { generateWithRetry } from './retry/retry-strategy.js';
import { shouldIncludeRawSvg } from './budget/truncate-svg.js';

const DEFAULT_TOKEN_BUDGET = 8000;

export interface GenerateOptions {
  client: AiClient;
  summary: SvgStructuredSummary;
  userPrompt: string;
  validNodeUids: string[];
  svgDocumentId: string;
  rawSvg?: string;
  priorPlan?: AnimationPlan;
  maxRetries?: number;
  tokenBudget?: number;
}

/**
 * Main entry point for generating an AnimationPlan from an SVG document.
 *
 * Pipeline: build prompts -> estimate tokens -> call AI with retry -> parse -> validate -> return plan.
 */
export async function generateAnimationPlan(
  options: GenerateOptions,
): Promise<Result<AnimationPlan, AiError>> {
  const {
    client,
    summary,
    userPrompt,
    validNodeUids,
    rawSvg,
    priorPlan,
    maxRetries = 3,
    tokenBudget = DEFAULT_TOKEN_BUDGET,
  } = options;

  // Build system prompt
  const systemPrompt = buildSystemPrompt();

  // Build user prompt based on whether we're chaining or generating fresh
  let prompt: string;

  if (priorPlan) {
    prompt = buildChainingPrompt(summary, priorPlan, userPrompt);
  } else {
    // Determine whether to include raw SVG based on token budget
    const includeRawSvg = rawSvg ? shouldIncludeRawSvg(rawSvg, tokenBudget) : false;
    prompt = buildGenerationPrompt(summary, userPrompt, includeRawSvg ? rawSvg : undefined);
  }

  // Validation function that parses and validates the AI response
  const validate = (responseText: string): Result<AnimationPlan, AiError> => {
    const parseResult = parseAiResponse(responseText);
    if (!parseResult.ok) {
      return parseResult;
    }
    return validateAiResponse(parseResult.value, validNodeUids);
  };

  // Call AI with retry logic
  return generateWithRetry(client, systemPrompt, prompt, validate, {
    maxAttempts: maxRetries,
  });
}
