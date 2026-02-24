import { describe, it, expect } from 'vitest';
import { AnimationGroupSchema } from '../../animation-plan/index.js';

const validGroup = {
  id: 'g1',
  name: 'Bounce In',
  effectType: 'bounce' as const,
  targets: [{ type: 'element' as const, nodeUid: 'node-1' }],
  startTime: 0,
  duration: 1.5,
  easingPreset: 'ease-in-out' as const,
  repeatCount: 1,
};

describe('AnimationGroupSchema', () => {
  it('parses a valid group successfully', () => {
    const result = AnimationGroupSchema.safeParse(validGroup);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('g1');
      expect(result.data.name).toBe('Bounce In');
      expect(result.data.effectType).toBe('bounce');
      expect(result.data.targets).toHaveLength(1);
    }
  });

  it('accepts named-set target refs', () => {
    const group = {
      ...validGroup,
      targets: [{ type: 'named-set' as const, name: 'circles' }],
    };
    const result = AnimationGroupSchema.safeParse(group);
    expect(result.success).toBe(true);
  });

  it('accepts repeatCount "indefinite"', () => {
    const group = { ...validGroup, repeatCount: 'indefinite' };
    const result = AnimationGroupSchema.safeParse(group);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = AnimationGroupSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects when id is empty', () => {
    const result = AnimationGroupSchema.safeParse({ ...validGroup, id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects when name is empty', () => {
    const result = AnimationGroupSchema.safeParse({ ...validGroup, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid effectType', () => {
    const result = AnimationGroupSchema.safeParse({
      ...validGroup,
      effectType: 'explode',
    });
    expect(result.success).toBe(false);
  });

  it('rejects duration of 0', () => {
    const result = AnimationGroupSchema.safeParse({
      ...validGroup,
      duration: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative duration', () => {
    const result = AnimationGroupSchema.safeParse({
      ...validGroup,
      duration: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty targets array', () => {
    const result = AnimationGroupSchema.safeParse({
      ...validGroup,
      targets: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative startTime', () => {
    const result = AnimationGroupSchema.safeParse({
      ...validGroup,
      startTime: -0.5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts startTime of 0', () => {
    const result = AnimationGroupSchema.safeParse({
      ...validGroup,
      startTime: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects repeatCount of 0', () => {
    const result = AnimationGroupSchema.safeParse({
      ...validGroup,
      repeatCount: 0,
    });
    expect(result.success).toBe(false);
  });
});
