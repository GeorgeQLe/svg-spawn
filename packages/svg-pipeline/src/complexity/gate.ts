import type { ComplexityScore } from '@svg-spawn/core';
import { type Result, ok, err } from '@svg-spawn/core';
import { ComplexityExceeded } from '../errors.js';

/**
 * Check if a complexity score is under the given limit.
 * Returns ok(score) if under the limit, or err(ComplexityExceeded) if over.
 */
export function gateComplexity(
  score: ComplexityScore,
  limit: number,
): Result<ComplexityScore, ComplexityExceeded> {
  if (score.totalScore > limit) {
    return err(new ComplexityExceeded(score.totalScore, limit));
  }
  return ok(score);
}
