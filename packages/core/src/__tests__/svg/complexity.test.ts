import { describe, it, expect } from 'vitest';
import { ComplexityScoreSchema, COMPLEXITY_THRESHOLDS } from '../../svg/complexity.js';

describe('ComplexityScoreSchema', () => {
  it('parses a valid complexity score', () => {
    const input = {
      totalScore: 250,
      elementCount: 45,
      pathCount: 12,
      totalPathLength: 1500.5,
      maxNestingDepth: 5,
      filterCount: 2,
      gradientCount: 3,
      clipPathCount: 1,
    };

    const result = ComplexityScoreSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('accepts zero values for all fields', () => {
    const input = {
      totalScore: 0,
      elementCount: 0,
      pathCount: 0,
      totalPathLength: 0,
      maxNestingDepth: 0,
      filterCount: 0,
      gradientCount: 0,
      clipPathCount: 0,
    };

    const result = ComplexityScoreSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('rejects totalScore less than 0', () => {
    const input = {
      totalScore: -1,
      elementCount: 0,
      pathCount: 0,
      totalPathLength: 0,
      maxNestingDepth: 0,
      filterCount: 0,
      gradientCount: 0,
      clipPathCount: 0,
    };

    expect(() => ComplexityScoreSchema.parse(input)).toThrow();
  });

  it('rejects negative elementCount', () => {
    const input = {
      totalScore: 10,
      elementCount: -1,
      pathCount: 0,
      totalPathLength: 0,
      maxNestingDepth: 0,
      filterCount: 0,
      gradientCount: 0,
      clipPathCount: 0,
    };

    expect(() => ComplexityScoreSchema.parse(input)).toThrow();
  });

  it('rejects negative pathCount', () => {
    const input = {
      totalScore: 10,
      elementCount: 5,
      pathCount: -3,
      totalPathLength: 0,
      maxNestingDepth: 0,
      filterCount: 0,
      gradientCount: 0,
      clipPathCount: 0,
    };

    expect(() => ComplexityScoreSchema.parse(input)).toThrow();
  });

  it('rejects negative totalPathLength', () => {
    const input = {
      totalScore: 10,
      elementCount: 5,
      pathCount: 2,
      totalPathLength: -100,
      maxNestingDepth: 0,
      filterCount: 0,
      gradientCount: 0,
      clipPathCount: 0,
    };

    expect(() => ComplexityScoreSchema.parse(input)).toThrow();
  });

  it('rejects negative filterCount', () => {
    const input = {
      totalScore: 10,
      elementCount: 5,
      pathCount: 2,
      totalPathLength: 100,
      maxNestingDepth: 3,
      filterCount: -1,
      gradientCount: 0,
      clipPathCount: 0,
    };

    expect(() => ComplexityScoreSchema.parse(input)).toThrow();
  });

  it('rejects negative gradientCount', () => {
    const input = {
      totalScore: 10,
      elementCount: 5,
      pathCount: 2,
      totalPathLength: 100,
      maxNestingDepth: 3,
      filterCount: 0,
      gradientCount: -2,
      clipPathCount: 0,
    };

    expect(() => ComplexityScoreSchema.parse(input)).toThrow();
  });

  it('rejects negative clipPathCount', () => {
    const input = {
      totalScore: 10,
      elementCount: 5,
      pathCount: 2,
      totalPathLength: 100,
      maxNestingDepth: 3,
      filterCount: 0,
      gradientCount: 0,
      clipPathCount: -1,
    };

    expect(() => ComplexityScoreSchema.parse(input)).toThrow();
  });
});

describe('COMPLEXITY_THRESHOLDS', () => {
  it('has correct threshold values', () => {
    expect(COMPLEXITY_THRESHOLDS.low).toBe(100);
    expect(COMPLEXITY_THRESHOLDS.medium).toBe(500);
    expect(COMPLEXITY_THRESHOLDS.high).toBe(1000);
    expect(COMPLEXITY_THRESHOLDS.max).toBe(5000);
  });

  it('thresholds are in ascending order', () => {
    expect(COMPLEXITY_THRESHOLDS.low).toBeLessThan(COMPLEXITY_THRESHOLDS.medium);
    expect(COMPLEXITY_THRESHOLDS.medium).toBeLessThan(COMPLEXITY_THRESHOLDS.high);
    expect(COMPLEXITY_THRESHOLDS.high).toBeLessThan(COMPLEXITY_THRESHOLDS.max);
  });
});
