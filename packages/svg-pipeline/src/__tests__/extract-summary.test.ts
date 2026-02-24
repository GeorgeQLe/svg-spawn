import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSvg } from '../parser/parse-svg.js';
import { normalize } from '../normalize/normalize.js';
import { extractSummary } from '../summary/extract-summary.js';
import type { SvgDocument } from '@svg-spawn/core';

const FIXTURES = join(import.meta.dirname, 'fixtures');

function parseNormalizeAndSummarize(svg: string) {
  const parseResult = parseSvg(svg);
  if (!parseResult.ok) throw new Error(`Parse failed: ${parseResult.error.message}`);
  const tree = normalize(parseResult.value);

  // Build minimal SvgDocument
  const viewBoxStr = tree.attributes.viewBox ?? tree.attributes.viewbox ?? '0 0 300 150';
  const parts = viewBoxStr.trim().split(/[\s,]+/).map(Number);
  const document: SvgDocument = {
    root: tree,
    viewBox: {
      minX: parts[0] ?? 0,
      minY: parts[1] ?? 0,
      width: parts[2] ?? 300,
      height: parts[3] ?? 150,
    },
    namespaces: {},
  };

  return extractSummary(document);
}

describe('extractSummary', () => {
  it('includes viewBox string', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue"/>
    </svg>`;
    const summary = parseNormalizeAndSummarize(svg);

    expect(summary.viewBox).toBe('0 0 100 100');
  });

  it('includes element inventory', () => {
    const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue"/>
      <rect x="100" y="10" width="80" height="80" fill="red"/>
      <circle cx="50" cy="150" r="30" fill="green"/>
    </svg>`;
    const summary = parseNormalizeAndSummarize(svg);

    expect(summary.elementInventory).toHaveProperty('svg', 1);
    expect(summary.elementInventory).toHaveProperty('rect', 2);
    expect(summary.elementInventory).toHaveProperty('circle', 1);
  });

  it('includes feature flags', () => {
    const svg = readFileSync(join(FIXTURES, 'with-gradients-filters.svg'), 'utf-8');
    const summary = parseNormalizeAndSummarize(svg);

    expect(summary.features.hasGradients).toBe(true);
    expect(summary.features.hasFilters).toBe(true);
    expect(summary.features.hasClipPaths).toBe(true);
  });

  it('includes elements list with nodeUids', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue"/>
    </svg>`;
    const summary = parseNormalizeAndSummarize(svg);

    expect(summary.elements.length).toBeGreaterThan(0);
    for (const el of summary.elements) {
      expect(el.nodeUid).toBeTruthy();
      expect(el.tagName).toBeTruthy();
    }
  });

  it('totalElements count matches', () => {
    const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="10" y="10" width="80" height="80" fill="blue"/>
        <circle cx="50" cy="150" r="30" fill="green"/>
      </g>
      <rect x="100" y="100" width="50" height="50" fill="red"/>
    </svg>`;
    const summary = parseNormalizeAndSummarize(svg);

    // svg + g + rect + circle + rect = 5
    expect(summary.totalElements).toBe(5);
    expect(summary.elements.length).toBe(5);
  });
});
