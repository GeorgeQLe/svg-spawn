import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSvg } from '../parser/parse-svg.js';
import { computeComplexityScore } from '../complexity/score.js';

const FIXTURES = join(import.meta.dirname, 'fixtures');

function parseAndScore(svg: string) {
  const parseResult = parseSvg(svg);
  if (!parseResult.ok) throw new Error(`Parse failed: ${parseResult.error.message}`);
  return computeComplexityScore(parseResult.value);
}

describe('computeComplexityScore', () => {
  it('simple SVG scores low', () => {
    const svg = readFileSync(join(FIXTURES, 'simple-rect.svg'), 'utf-8');
    const score = parseAndScore(svg);

    expect(score.totalScore).toBeLessThan(100);
    expect(score.elementCount).toBe(2); // svg + rect
    expect(score.pathCount).toBe(0);
    expect(score.filterCount).toBe(0);
    expect(score.gradientCount).toBe(0);
    expect(score.clipPathCount).toBe(0);
  });

  it('complex SVG scores high', () => {
    const svg = readFileSync(join(FIXTURES, 'complex.svg'), 'utf-8');
    const score = parseAndScore(svg);

    expect(score.totalScore).toBeGreaterThan(100);
    expect(score.elementCount).toBeGreaterThan(10);
    expect(score.pathCount).toBeGreaterThan(0);
    expect(score.filterCount).toBeGreaterThan(0);
    expect(score.gradientCount).toBeGreaterThan(0);
    expect(score.clipPathCount).toBeGreaterThan(0);
  });

  it('filters increase score significantly', () => {
    const svgNoFilter = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue"/>
    </svg>`;
    const svgWithFilter = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="f1"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" fill="blue" filter="url(#f1)"/>
    </svg>`;

    const scoreNoFilter = parseAndScore(svgNoFilter);
    const scoreWithFilter = parseAndScore(svgWithFilter);

    // Filter adds 20 to score (plus additional elements)
    expect(scoreWithFilter.totalScore).toBeGreaterThan(scoreNoFilter.totalScore + 15);
    expect(scoreWithFilter.filterCount).toBe(1);
  });

  it('empty SVG (just root svg element) scores near 0', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>`;
    const score = parseAndScore(svg);

    // Just the root svg element: 1 element * 1 + 0 nesting depth * 2 = 1
    expect(score.totalScore).toBeLessThanOrEqual(1);
    expect(score.elementCount).toBe(1);
    expect(score.pathCount).toBe(0);
    expect(score.filterCount).toBe(0);
    expect(score.gradientCount).toBe(0);
    expect(score.clipPathCount).toBe(0);
    expect(score.maxNestingDepth).toBe(0);
  });
});
