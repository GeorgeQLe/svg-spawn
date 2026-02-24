import { estimateTokens } from './estimate-tokens.js';

/**
 * Determines whether the raw SVG should be included in the prompt
 * based on its estimated token count relative to the budget.
 */
export function shouldIncludeRawSvg(svgString: string, maxTokenBudget: number): boolean {
  const tokens = estimateTokens(svgString);
  return tokens <= maxTokenBudget;
}
