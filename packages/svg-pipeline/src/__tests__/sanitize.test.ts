import { describe, it, expect } from 'vitest';
import { parseSvg } from '../parser/parse-svg.js';
import { sanitize } from '../sanitize/sanitize.js';
import type { SvgElement } from '@svg-spawn/core';

/**
 * Helper to parse SVG and sanitize in one step.
 */
function parseAndSanitize(svg: string): SvgElement {
  const parseResult = parseSvg(svg);
  if (!parseResult.ok) throw new Error(`Parse failed: ${parseResult.error.message}`);
  const sanitizeResult = sanitize(parseResult.value);
  if (!sanitizeResult.ok) throw new Error(`Sanitize failed: ${sanitizeResult.error.message}`);
  return sanitizeResult.value;
}

/**
 * Helper to find an element by tag name in the tree.
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
 * Helper to check if an element exists anywhere in the tree.
 */
function hasElement(root: SvgElement, tagName: string): boolean {
  return findElement(root, tagName) !== undefined;
}

describe('sanitize', () => {
  it('strips <script> elements', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue"/>
      <script>alert('xss')</script>
    </svg>`;
    const result = parseAndSanitize(svg);
    expect(hasElement(result, 'script')).toBe(false);
    expect(hasElement(result, 'rect')).toBe(true);
  });

  it('strips on* event attributes', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue" onclick="alert('xss')" onmouseover="steal()"/>
    </svg>`;
    const result = parseAndSanitize(svg);
    const rect = findElement(result, 'rect')!;
    expect(rect).toBeDefined();
    expect(rect.attributes).not.toHaveProperty('onclick');
    expect(rect.attributes).not.toHaveProperty('onmouseover');
    expect(rect.attributes).toHaveProperty('fill', 'blue');
  });

  it('strips <foreignObject>', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <foreignObject x="0" y="0" width="100" height="100">
        <div>HTML content</div>
      </foreignObject>
      <rect x="10" y="10" width="80" height="80" fill="red"/>
    </svg>`;
    const result = parseAndSanitize(svg);
    expect(hasElement(result, 'foreignObject')).toBe(false);
    expect(hasElement(result, 'rect')).toBe(true);
  });

  it('strips <iframe>', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <iframe src="http://evil.com"/>
      <rect x="10" y="10" width="80" height="80" fill="red"/>
    </svg>`;
    const result = parseAndSanitize(svg);
    expect(hasElement(result, 'iframe')).toBe(false);
    expect(hasElement(result, 'rect')).toBe(true);
  });

  it('strips javascript: href values', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <image href="javascript:alert('xss')" width="100" height="100"/>
    </svg>`;
    const result = parseAndSanitize(svg);
    const image = findElement(result, 'image');
    expect(image).toBeDefined();
    // The href should have been stripped
    expect(image!.attributes).not.toHaveProperty('href');
  });

  it('preserves allowed elements (rect, circle, path, etc.)', () => {
    const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="blue"/>
      <circle cx="150" cy="50" r="30" fill="red"/>
      <path d="M 10 80 L 50 80" stroke="black"/>
      <ellipse cx="100" cy="150" rx="40" ry="20" fill="green"/>
      <line x1="0" y1="0" x2="100" y2="100" stroke="gray"/>
      <polygon points="50,50 100,100 0,100" fill="yellow"/>
      <polyline points="10,10 50,50 90,10" stroke="purple" fill="none"/>
    </svg>`;
    const result = parseAndSanitize(svg);
    expect(hasElement(result, 'rect')).toBe(true);
    expect(hasElement(result, 'circle')).toBe(true);
    expect(hasElement(result, 'path')).toBe(true);
    expect(hasElement(result, 'ellipse')).toBe(true);
    expect(hasElement(result, 'line')).toBe(true);
    expect(hasElement(result, 'polygon')).toBe(true);
    expect(hasElement(result, 'polyline')).toBe(true);
  });

  it('preserves internal xlink:href (e.g., #myId)', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <symbol id="mySymbol">
          <rect x="0" y="0" width="50" height="50" fill="blue"/>
        </symbol>
      </defs>
      <use xlink:href="#mySymbol" x="25" y="25"/>
    </svg>`;
    const result = parseAndSanitize(svg);
    const use = findElement(result, 'use');
    expect(use).toBeDefined();
    expect(
      use!.attributes['xlink:href'] === '#mySymbol' ||
      use!.attributes['href'] === '#mySymbol'
    ).toBe(true);
  });

  it('allows data:image/png in image href', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <image href="${dataUri}" width="100" height="100"/>
    </svg>`;
    const result = parseAndSanitize(svg);
    const image = findElement(result, 'image');
    expect(image).toBeDefined();
    expect(image!.attributes.href).toBe(dataUri);
  });

  it('rejects data:text/html in href', () => {
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <image href="data:text/html,<script>alert('xss')</script>" width="100" height="100"/>
    </svg>`;
    const result = parseAndSanitize(svg);
    const image = findElement(result, 'image');
    expect(image).toBeDefined();
    expect(image!.attributes).not.toHaveProperty('href');
  });
});
