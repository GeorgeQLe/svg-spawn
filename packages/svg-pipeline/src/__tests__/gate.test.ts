import { describe, it, expect } from 'vitest';
import type { ComplexityScore } from '@svg-spawn/core';
import { gateComplexity } from '../complexity/gate.js';
import { ComplexityExceeded } from '../errors.js';

function makeScore(totalScore: number): ComplexityScore {
  return {
    totalScore,
    elementCount: 10,
    pathCount: 2,
    totalPathLength: 20,
    maxNestingDepth: 3,
    filterCount: 0,
    gradientCount: 0,
    clipPathCount: 0,
  };
}

describe('gateComplexity', () => {
  it('under limit passes (returns ok)', () => {
    const score = makeScore(100);
    const result = gateComplexity(score, 500);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(score);
    }
  });

  it('at exactly the limit passes', () => {
    const score = makeScore(500);
    const result = gateComplexity(score, 500);

    expect(result.ok).toBe(true);
  });

  it('over limit returns ComplexityExceeded error', () => {
    const score = makeScore(600);
    const result = gateComplexity(score, 500);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ComplexityExceeded);
      expect(result.error.score).toBe(600);
      expect(result.error.limit).toBe(500);
    }
  });
});
