import { describe, it, expect } from 'vitest';
import { AnimationPlanSchema } from '../../animation-plan/index.js';

const validPlan = {
  id: 'plan-1',
  svgDocumentId: 'svg-doc-1',
  groups: [
    {
      id: 'g1',
      name: 'Fade In',
      effectType: 'fade' as const,
      targets: [{ type: 'element' as const, nodeUid: 'node-1' }],
      startTime: 0,
      duration: 1,
      easingPreset: 'ease-in' as const,
      repeatCount: 1,
    },
  ],
  channels: {
    'node-1': [
      {
        property: 'opacity',
        keyframes: [
          { offset: 0, value: 0 },
          { offset: 1, value: 1 },
        ],
        duration: 1,
        delay: 0,
        repeatCount: 1,
        fill: 'forwards' as const,
        compilationBackend: 'auto' as const,
      },
    ],
  },
  metadata: {
    generatedAt: '2026-02-23T00:00:00Z',
    modelId: 'claude-opus-4-6',
    userPrompt: 'Fade in the logo',
  },
};

describe('AnimationPlanSchema', () => {
  it('parses a valid plan successfully', () => {
    const result = AnimationPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('plan-1');
      expect(result.data.svgDocumentId).toBe('svg-doc-1');
      expect(result.data.groups).toHaveLength(1);
      expect(result.data.channels['node-1']).toHaveLength(1);
      expect(result.data.metadata.modelId).toBe('claude-opus-4-6');
    }
  });

  it('allows empty groups array', () => {
    const plan = { ...validPlan, groups: [] };
    const result = AnimationPlanSchema.safeParse(plan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.groups).toHaveLength(0);
    }
  });

  it('allows empty channels record', () => {
    const plan = { ...validPlan, channels: {} };
    const result = AnimationPlanSchema.safeParse(plan);
    expect(result.success).toBe(true);
  });

  it('requires metadata', () => {
    const { metadata: _, ...planWithoutMetadata } = validPlan;
    const result = AnimationPlanSchema.safeParse(planWithoutMetadata);
    expect(result.success).toBe(false);
  });

  it('rejects metadata missing generatedAt', () => {
    const plan = {
      ...validPlan,
      metadata: { modelId: 'test', userPrompt: 'test' },
    };
    const result = AnimationPlanSchema.safeParse(plan);
    expect(result.success).toBe(false);
  });

  it('rejects metadata missing modelId', () => {
    const plan = {
      ...validPlan,
      metadata: { generatedAt: '2026-01-01', userPrompt: 'test' },
    };
    const result = AnimationPlanSchema.safeParse(plan);
    expect(result.success).toBe(false);
  });

  it('rejects metadata missing userPrompt', () => {
    const plan = {
      ...validPlan,
      metadata: { generatedAt: '2026-01-01', modelId: 'test' },
    };
    const result = AnimationPlanSchema.safeParse(plan);
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const { id: _, ...planWithoutId } = validPlan;
    const result = AnimationPlanSchema.safeParse(planWithoutId);
    expect(result.success).toBe(false);
  });

  it('rejects missing svgDocumentId', () => {
    const { svgDocumentId: _, ...planWithoutSvgId } = validPlan;
    const result = AnimationPlanSchema.safeParse(planWithoutSvgId);
    expect(result.success).toBe(false);
  });
});
