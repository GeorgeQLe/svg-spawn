/**
 * Rough token estimation based on character count.
 * Uses the approximation of ~4 characters per token.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
