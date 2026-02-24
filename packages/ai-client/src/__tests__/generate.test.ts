import { describe, it, expect } from 'vitest';
import { ok, type SvgStructuredSummary, type AnimationPlan } from '@svg-spawn/core';
import { MockAiClient } from '../gemini/client.js';
import { generateAnimationPlan } from '../generate.js';

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

const validPlan = {
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

const validPlanJson = JSON.stringify(validPlan);

const invalidPlanJson = JSON.stringify({
  id: 'plan-1',
  svgDocumentId: 'doc-1',
  groups: [
    {
      id: 'group-1',
      name: 'Bad group',
      effectType: 'fade',
      targets: [{ type: 'element', nodeUid: 'nonexistent-node' }],
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
    userPrompt: 'test',
  },
});

describe('generateAnimationPlan', () => {
  it('happy path: mock returns valid plan', async () => {
    const client = new MockAiClient([ok(validPlanJson)]);

    const result = await generateAnimationPlan({
      client,
      summary: mockSummary,
      userPrompt: 'Fade in the circle',
      validNodeUids: ['node-1'],
      svgDocumentId: 'doc-1',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('plan-1');
      expect(result.value.groups).toHaveLength(1);
      expect(result.value.groups[0]!.effectType).toBe('fade');
    }
  });

  it('retry path: first response invalid, second valid', async () => {
    const client = new MockAiClient([
      ok(invalidPlanJson),
      ok(validPlanJson),
    ]);

    const result = await generateAnimationPlan({
      client,
      summary: mockSummary,
      userPrompt: 'Fade in the circle',
      validNodeUids: ['node-1'],
      svgDocumentId: 'doc-1',
      maxRetries: 3,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('plan-1');
    }
  });

  it('failure path: all responses invalid', async () => {
    const client = new MockAiClient([
      ok(invalidPlanJson),
      ok(invalidPlanJson),
      ok(invalidPlanJson),
    ]);

    const result = await generateAnimationPlan({
      client,
      summary: mockSummary,
      userPrompt: 'Fade in the circle',
      validNodeUids: ['node-1'],
      svgDocumentId: 'doc-1',
      maxRetries: 3,
    });

    expect(result.ok).toBe(false);
  });

  it('chaining path: with priorPlan, generates refinement', async () => {
    const priorPlan: AnimationPlan = validPlan;
    const client = new MockAiClient([ok(validPlanJson)]);

    const result = await generateAnimationPlan({
      client,
      summary: mockSummary,
      userPrompt: 'Make it faster',
      validNodeUids: ['node-1'],
      svgDocumentId: 'doc-1',
      priorPlan,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('plan-1');
    }
  });

  it('token budget: large SVG excluded from prompt', async () => {
    // Create a large SVG string that exceeds the token budget
    const largeSvg = '<svg>' + 'x'.repeat(100000) + '</svg>';
    const client = new MockAiClient([ok(validPlanJson)]);

    const result = await generateAnimationPlan({
      client,
      summary: mockSummary,
      userPrompt: 'Fade in the circle',
      validNodeUids: ['node-1'],
      svgDocumentId: 'doc-1',
      rawSvg: largeSvg,
      tokenBudget: 100, // Very small budget
    });

    // The plan should still be generated (SVG is just excluded from prompt)
    expect(result.ok).toBe(true);
  });
});
