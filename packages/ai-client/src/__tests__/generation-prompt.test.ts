import { describe, it, expect } from 'vitest';
import type { SvgStructuredSummary } from '@svg-spawn/core';
import { buildGenerationPrompt } from '../prompts/generation-prompt.js';

const mockSummary: SvgStructuredSummary = {
  viewBox: '0 0 100 100',
  dimensions: { width: 100, height: 100 },
  elementInventory: { circle: 1, rect: 1 },
  totalElements: 2,
  maxDepth: 2,
  features: {
    hasGradients: false,
    hasFilters: false,
    hasClipPaths: false,
    hasMasks: false,
    hasPatterns: false,
    hasText: false,
  },
  elements: [
    { nodeUid: 'node-1', tagName: 'circle', path: ['svg', 'circle'] },
    { nodeUid: 'node-2', tagName: 'rect', path: ['svg', 'rect'] },
  ],
};

describe('buildGenerationPrompt', () => {
  it('includes summary content', () => {
    const prompt = buildGenerationPrompt(mockSummary, 'Animate the circle');

    expect(prompt).toContain('SVG Document Summary');
    expect(prompt).toContain('node-1');
    expect(prompt).toContain('circle');
    expect(prompt).toContain('0 0 100 100');
  });

  it('includes user instruction', () => {
    const prompt = buildGenerationPrompt(mockSummary, 'Make the circle bounce');

    expect(prompt).toContain('User Animation Instruction');
    expect(prompt).toContain('Make the circle bounce');
  });

  it('includes raw SVG when provided', () => {
    const rawSvg = '<svg><circle cx="50" cy="50" r="25"/></svg>';
    const prompt = buildGenerationPrompt(mockSummary, 'Animate it', rawSvg);

    expect(prompt).toContain('Raw SVG Source');
    expect(prompt).toContain(rawSvg);
  });

  it('omits raw SVG when not provided', () => {
    const prompt = buildGenerationPrompt(mockSummary, 'Animate it');

    expect(prompt).not.toContain('Raw SVG Source');
  });
});
