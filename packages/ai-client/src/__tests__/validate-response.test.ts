import { describe, it, expect } from 'vitest';
import { validateAiResponse } from '../response/validate-response.js';

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

const validNodeUids = ['node-1', 'node-2', 'node-3'];

describe('validateAiResponse', () => {
  it('valid plan passes', () => {
    const result = validateAiResponse(validPlan, validNodeUids);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('plan-1');
      expect(result.value.groups).toHaveLength(1);
    }
  });

  it('nonexistent target nodeUids fail', () => {
    const planWithBadUid = {
      ...validPlan,
      groups: [
        {
          ...validPlan.groups[0],
          targets: [{ type: 'element', nodeUid: 'nonexistent-node' }],
        },
      ],
    };

    const result = validateAiResponse(planWithBadUid, validNodeUids);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation');
      expect(result.error.message).toContain('nonexistent-node');
    }
  });

  it('invalid effectType fails', () => {
    const planWithBadEffect = {
      ...validPlan,
      groups: [
        {
          ...validPlan.groups[0],
          effectType: 'explode',
        },
      ],
    };

    const result = validateAiResponse(planWithBadEffect, validNodeUids);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation');
    }
  });

  it('missing required fields fail', () => {
    const incompletePlan = {
      id: 'plan-1',
      svgDocumentId: 'doc-1',
      // missing groups, channels, metadata
    };

    const result = validateAiResponse(incompletePlan, validNodeUids);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation');
    }
  });
});
