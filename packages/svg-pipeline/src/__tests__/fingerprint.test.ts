import { describe, it, expect } from 'vitest';
import { parseSvg } from '../parser/parse-svg.js';
import { assignUids } from '../normalize/assign-uids.js';
import { computeFingerprints } from '../normalize/fingerprint.js';
import type { SvgElement } from '@svg-spawn/core';

/**
 * Helper to parse, assign UIDs, and compute fingerprints.
 */
function parseAndFingerprint(svg: string): SvgElement {
  const parseResult = parseSvg(svg);
  if (!parseResult.ok) throw new Error(`Parse failed: ${parseResult.error.message}`);
  const withUids = assignUids(parseResult.value);
  return computeFingerprints(withUids);
}

/**
 * Helper to find an element by tag name.
 */
function findElement(root: SvgElement, tagName: string): SvgElement | undefined {
  if (root.tagName === tagName) return root;
  for (const child of root.children) {
    const found = findElement(child, tagName);
    if (found) return found;
  }
  return undefined;
}

/**
 * Helper to find all elements by tag name.
 */
function findAllElements(root: SvgElement, tagName: string): SvgElement[] {
  const results: SvgElement[] = [];
  if (root.tagName === tagName) results.push(root);
  for (const child of root.children) {
    results.push(...findAllElements(child, tagName));
  }
  return results;
}

describe('computeFingerprints', () => {
  it('captures tagName, fill, stroke, opacity, ancestry', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="10" y="10" width="80" height="80" fill="blue" stroke="red" opacity="0.5"/>
      </g>
    </svg>`;
    const tree = parseAndFingerprint(svg);
    const rect = findElement(tree, 'rect')!;

    expect(rect.fingerprint).toBeDefined();
    expect(rect.fingerprint!.tagName).toBe('rect');
    expect(rect.fingerprint!.fill).toBe('blue');
    expect(rect.fingerprint!.stroke).toBe('red');
    expect(rect.fingerprint!.opacity).toBe(0.5);
    expect(rect.fingerprint!.ancestryPath).toEqual(['svg', 'g']);
  });

  it('different elements produce different fingerprints', () => {
    const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue"/>
      <circle cx="150" cy="50" r="30" fill="red"/>
    </svg>`;
    const tree = parseAndFingerprint(svg);
    const rect = findElement(tree, 'rect')!;
    const circle = findElement(tree, 'circle')!;

    expect(rect.fingerprint).toBeDefined();
    expect(circle.fingerprint).toBeDefined();
    expect(rect.fingerprint!.tagName).not.toBe(circle.fingerprint!.tagName);
    expect(rect.fingerprint!.fill).not.toBe(circle.fingerprint!.fill);
  });

  it('elements with same tag but different attributes produce different fingerprints', () => {
    const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue" stroke="black"/>
      <rect x="100" y="10" width="80" height="80" fill="red" stroke="green"/>
    </svg>`;
    const tree = parseAndFingerprint(svg);
    const rects = findAllElements(tree, 'rect');

    expect(rects.length).toBe(2);
    expect(rects[0].fingerprint).toBeDefined();
    expect(rects[1].fingerprint).toBeDefined();
    expect(rects[0].fingerprint!.fill).toBe('blue');
    expect(rects[1].fingerprint!.fill).toBe('red');
    expect(rects[0].fingerprint!.stroke).toBe('black');
    expect(rects[1].fingerprint!.stroke).toBe('green');
  });
});
