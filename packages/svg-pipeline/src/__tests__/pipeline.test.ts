import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { processSvg } from '../pipeline.js';
import { ComplexityExceeded } from '../errors.js';
import type { SvgElement } from '@svg-spawn/core';

const FIXTURES = join(import.meta.dirname, 'fixtures');

/**
 * Helper to check if an element exists anywhere in the tree.
 */
function hasElement(root: SvgElement, tagName: string): boolean {
  if (root.tagName === tagName) return true;
  return root.children.some((child) => hasElement(child, tagName));
}

describe('processSvg (integration)', () => {
  it('end-to-end happy path with simple SVG', () => {
    const svg = readFileSync(join(FIXTURES, 'simple-rect.svg'), 'utf-8');
    const result = processSvg(svg);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { document, summary, complexity, hadAnimations } = result.value;

    // Document
    expect(document.root.tagName).toBe('svg');
    expect(document.viewBox).toEqual({ minX: 0, minY: 0, width: 100, height: 100 });

    // Summary
    expect(summary.viewBox).toBe('0 0 100 100');
    expect(summary.totalElements).toBe(2); // svg + rect
    expect(summary.elementInventory).toHaveProperty('rect', 1);

    // Complexity
    expect(complexity.totalScore).toBeLessThan(100);
    expect(complexity.elementCount).toBe(2);

    // No animations
    expect(hadAnimations).toBe(false);
  });

  it('strips scripts and produces valid output', () => {
    const svg = readFileSync(join(FIXTURES, 'with-script.svg'), 'utf-8');
    const result = processSvg(svg);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { document } = result.value;

    // Script should be removed
    expect(hasElement(document.root, 'script')).toBe(false);

    // Rect should remain
    expect(hasElement(document.root, 'rect')).toBe(true);

    // onclick should be removed from rect
    const rect = document.root.children.find((c) => c.tagName === 'rect');
    expect(rect).toBeDefined();
    expect(rect!.attributes).not.toHaveProperty('onclick');
  });

  it('rejects SVG that exceeds complexity limit', () => {
    const svg = readFileSync(join(FIXTURES, 'complex.svg'), 'utf-8');

    // Use a very low limit to force rejection
    const result = processSvg(svg, { maxComplexity: 5 });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error).toBeInstanceOf(ComplexityExceeded);
  });

  it('detects and strips existing animations', () => {
    const svg = readFileSync(join(FIXTURES, 'with-animations.svg'), 'utf-8');
    const result = processSvg(svg);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { document, hadAnimations } = result.value;

    expect(hadAnimations).toBe(true);

    // Animation elements should be stripped
    expect(hasElement(document.root, 'animate')).toBe(false);
    expect(hasElement(document.root, 'animateTransform')).toBe(false);
    expect(hasElement(document.root, 'animateMotion')).toBe(false);
    expect(hasElement(document.root, 'set')).toBe(false);

    // Non-animation elements should remain
    expect(hasElement(document.root, 'rect')).toBe(true);
    expect(hasElement(document.root, 'circle')).toBe(true);
  });

  it('SVG with gradients/filters gets correct feature flags', () => {
    const svg = readFileSync(join(FIXTURES, 'with-gradients-filters.svg'), 'utf-8');
    const result = processSvg(svg);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { summary, complexity } = result.value;

    // Feature flags
    expect(summary.features.hasGradients).toBe(true);
    expect(summary.features.hasFilters).toBe(true);
    expect(summary.features.hasClipPaths).toBe(true);

    // Complexity should reflect these features
    expect(complexity.gradientCount).toBeGreaterThan(0);
    expect(complexity.filterCount).toBeGreaterThan(0);
    expect(complexity.clipPathCount).toBeGreaterThan(0);
  });
});
