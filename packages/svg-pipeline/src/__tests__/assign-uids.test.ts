import { describe, it, expect } from 'vitest';
import { parseSvg } from '../parser/parse-svg.js';
import { assignUids } from '../normalize/assign-uids.js';
import type { SvgElement } from '@svg-spawn/core';

/**
 * Helper to collect all nodeUids from a tree.
 */
function collectUids(element: SvgElement): string[] {
  const uids: string[] = [element.nodeUid];
  for (const child of element.children) {
    uids.push(...collectUids(child));
  }
  return uids;
}

/**
 * Helper to parse and assign UIDs.
 */
function parseAndAssignUids(svg: string): SvgElement {
  const parseResult = parseSvg(svg);
  if (!parseResult.ok) throw new Error(`Parse failed: ${parseResult.error.message}`);
  return assignUids(parseResult.value);
}

describe('assignUids', () => {
  it('assigns unique UIDs to all elements', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue"/>
      <circle cx="50" cy="50" r="30" fill="red"/>
      <rect x="20" y="20" width="60" height="60" fill="green"/>
    </svg>`;
    const tree = parseAndAssignUids(svg);
    const uids = collectUids(tree);

    // All UIDs should be non-empty strings
    for (const uid of uids) {
      expect(uid).toBeTruthy();
      expect(typeof uid).toBe('string');
    }

    // All UIDs should be unique
    const uniqueUids = new Set(uids);
    expect(uniqueUids.size).toBe(uids.length);
  });

  it('UIDs are deterministic (same input produces same UIDs)', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="0" y="0" width="50" height="50" fill="blue"/>
        <circle cx="75" cy="25" r="20" fill="red"/>
      </g>
    </svg>`;

    const tree1 = parseAndAssignUids(svg);
    const tree2 = parseAndAssignUids(svg);

    const uids1 = collectUids(tree1);
    const uids2 = collectUids(tree2);

    expect(uids1).toEqual(uids2);
  });

  it('nested elements all get UIDs', () => {
    const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g>
        <g>
          <g>
            <rect x="0" y="0" width="10" height="10" fill="blue"/>
          </g>
        </g>
      </g>
    </svg>`;
    const tree = parseAndAssignUids(svg);
    const uids = collectUids(tree);

    // svg, g, g, g, rect = 5 elements
    expect(uids.length).toBe(5);

    // All UIDs should be non-empty
    for (const uid of uids) {
      expect(uid.length).toBeGreaterThan(0);
    }

    // UIDs should contain path information
    expect(tree.nodeUid).toBe('svg-0');
    expect(tree.children[0].nodeUid).toContain('g-0');
    expect(tree.children[0].children[0].nodeUid).toContain('g-0');
  });
});
