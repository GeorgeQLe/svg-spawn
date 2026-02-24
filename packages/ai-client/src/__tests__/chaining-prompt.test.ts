import { describe, it, expect } from 'vitest';
import type { SvgStructuredSummary, AnimationPlan } from '@svg-spawn/core';
import { buildChainingPrompt } from '../prompts/chaining-prompt.js';

const mockSummary: SvgStructuredSummary = {
  viewBox: '0 0 100 100',
  dimensions: { width: 100, height: 100 },
  elementInventory: { circle: 1 },
  totalElements: 1,
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
  ],
};

const mockPriorPlan: AnimationPlan = {
  id: 'plan-1',
  svgDocumentId: 'doc-1',
  groups: [
    {
      id: 'group-1',
      name: 'Fade in circle',
      effectType: 'fade',
      targets: [{ type: 'element', nodeUid: 'node-1' }],
      startTime: 0,
      duration: 1,
      easingPreset: 'ease-in-out',
      repeatCount: 1,
    },
  ],
  channels: {
    'group-1': [
      {
        property: 'opacity',
        keyframes: [
          { offset: 0, value: 0 },
          { offset: 1, value: 1 },
        ],
        duration: 1,
        delay: 0,
        repeatCount: 1,
        fill: 'forwards',
        compilationBackend: 'auto',
      },
    ],
  },
  metadata: {
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelId: 'gemini-pro',
    userPrompt: 'Fade in the circle',
  },
};

describe('buildChainingPrompt', () => {
  it('includes prior plan', () => {
    const prompt = buildChainingPrompt(mockSummary, mockPriorPlan, 'Make it faster');

    expect(prompt).toContain('Current Animation Plan');
    expect(prompt).toContain('plan-1');
    expect(prompt).toContain('Fade in circle');
    expect(prompt).toContain('opacity');
  });

  it('includes refinement instruction', () => {
    const prompt = buildChainingPrompt(mockSummary, mockPriorPlan, 'Change the duration to 2 seconds');

    expect(prompt).toContain('Refinement Instruction');
    expect(prompt).toContain('Change the duration to 2 seconds');
  });

  it('includes summary context', () => {
    const prompt = buildChainingPrompt(mockSummary, mockPriorPlan, 'Add bounce');

    expect(prompt).toContain('SVG Document Summary');
    expect(prompt).toContain('node-1');
    expect(prompt).toContain('circle');
  });
});
