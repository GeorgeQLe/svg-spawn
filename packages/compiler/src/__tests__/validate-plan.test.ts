import { describe, it, expect } from 'vitest';
import { validatePlan } from '../validation/validate-plan.js';
import { createTestDocument, createFadePlan } from './fixtures.js';
import type { AnimationPlan } from '@svg-spawn/core';

describe('validate-plan', () => {
  const doc = createTestDocument();

  it('valid plan passes', () => {
    const plan = createFadePlan();
    const result = validatePlan(plan, doc);
    expect(result.ok).toBe(true);
  });

  it('nonexistent target nodeUid fails', () => {
    const plan: AnimationPlan = {
      ...createFadePlan(),
      groups: [
        {
          id: 'g-bad',
          name: 'Bad Target',
          effectType: 'fade',
          targets: [{ type: 'element', nodeUid: 'does-not-exist' }],
          startTime: 0,
          duration: 500,
          easingPreset: 'ease-out',
          repeatCount: 1,
        },
      ],
    };
    const result = validatePlan(plan, doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.details.some((d) => d.includes('does-not-exist'))).toBe(true);
  });

  it('negative duration fails', () => {
    const plan: AnimationPlan = {
      ...createFadePlan(),
      groups: [
        {
          id: 'g-neg',
          name: 'Neg Duration',
          effectType: 'fade',
          targets: [{ type: 'element', nodeUid: 'circle-1' }],
          startTime: 0,
          duration: -100,
          easingPreset: 'ease-out',
          repeatCount: 1,
        },
      ],
    };
    const result = validatePlan(plan, doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.details.some((d) => d.includes('non-positive duration'))).toBe(true);
  });

  it('duplicate property drivers in channels fails', () => {
    const plan: AnimationPlan = {
      ...createFadePlan(),
      groups: [],
      channels: {
        'circle-1': [
          {
            property: 'opacity',
            keyframes: [
              { offset: 0, value: 0 },
              { offset: 1, value: 1 },
            ],
            duration: 500,
            delay: 0,
            repeatCount: 1,
            fill: 'forwards',
            compilationBackend: 'auto',
          },
          {
            property: 'opacity',
            keyframes: [
              { offset: 0, value: 1 },
              { offset: 1, value: 0 },
            ],
            duration: 500,
            delay: 0,
            repeatCount: 1,
            fill: 'forwards',
            compilationBackend: 'auto',
          },
        ],
      },
    };
    const result = validatePlan(plan, doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.details.some((d) => d.includes('Duplicate property driver'))).toBe(true);
  });

  it('empty plan passes', () => {
    const plan: AnimationPlan = {
      id: 'empty',
      svgDocumentId: 'doc-1',
      groups: [],
      channels: {},
      metadata: {
        generatedAt: '2025-01-01T00:00:00Z',
        modelId: 'test',
        userPrompt: 'nothing',
      },
    };
    const result = validatePlan(plan, doc);
    expect(result.ok).toBe(true);
  });

  it('channel referencing nonexistent nodeUid fails', () => {
    const plan: AnimationPlan = {
      ...createFadePlan(),
      groups: [],
      channels: {
        'nonexistent-uid': [
          {
            property: 'opacity',
            keyframes: [
              { offset: 0, value: 0 },
              { offset: 1, value: 1 },
            ],
            duration: 500,
            delay: 0,
            repeatCount: 1,
            fill: 'forwards',
            compilationBackend: 'auto',
          },
        ],
      },
    };
    const result = validatePlan(plan, doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.details.some((d) => d.includes('nonexistent-uid'))).toBe(true);
  });
});
