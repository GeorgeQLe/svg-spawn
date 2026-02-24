import { describe, it, expect } from 'vitest';
import {
  AnimationChannelSchema,
  KeyframeSchema,
} from '../../animation-plan/index.js';

const validChannel = {
  property: 'opacity',
  keyframes: [
    { offset: 0, value: 0 },
    { offset: 1, value: 1 },
  ],
  duration: 2,
  delay: 0,
  repeatCount: 1,
  fill: 'forwards' as const,
  compilationBackend: 'auto' as const,
};

describe('KeyframeSchema', () => {
  it('accepts a keyframe with offset in 0-1 range', () => {
    const result = KeyframeSchema.safeParse({ offset: 0.5, value: 'red' });
    expect(result.success).toBe(true);
  });

  it('accepts a keyframe with optional easing', () => {
    const result = KeyframeSchema.safeParse({
      offset: 0,
      value: 100,
      easing: 'ease-in',
    });
    expect(result.success).toBe(true);
  });

  it('rejects keyframe offset below 0', () => {
    const result = KeyframeSchema.safeParse({ offset: -0.1, value: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects keyframe offset above 1', () => {
    const result = KeyframeSchema.safeParse({ offset: 1.1, value: 0 });
    expect(result.success).toBe(false);
  });
});

describe('AnimationChannelSchema', () => {
  it('parses a valid channel successfully', () => {
    const result = AnimationChannelSchema.safeParse(validChannel);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.property).toBe('opacity');
      expect(result.data.keyframes).toHaveLength(2);
    }
  });

  it('accepts string keyframe values', () => {
    const channel = {
      ...validChannel,
      keyframes: [
        { offset: 0, value: 'red' },
        { offset: 1, value: 'blue' },
      ],
    };
    const result = AnimationChannelSchema.safeParse(channel);
    expect(result.success).toBe(true);
  });

  it('accepts repeatCount "indefinite"', () => {
    const channel = { ...validChannel, repeatCount: 'indefinite' };
    const result = AnimationChannelSchema.safeParse(channel);
    expect(result.success).toBe(true);
  });

  it('rejects keyframe offsets outside 0-1 range', () => {
    const channel = {
      ...validChannel,
      keyframes: [
        { offset: -0.5, value: 0 },
        { offset: 1, value: 1 },
      ],
    };
    const result = AnimationChannelSchema.safeParse(channel);
    expect(result.success).toBe(false);
  });

  it('rejects keyframe offsets not in ascending order', () => {
    const channel = {
      ...validChannel,
      keyframes: [
        { offset: 0, value: 0 },
        { offset: 0.8, value: 0.5 },
        { offset: 0.5, value: 1 },
      ],
    };
    const result = AnimationChannelSchema.safeParse(channel);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate keyframe offsets', () => {
    const channel = {
      ...validChannel,
      keyframes: [
        { offset: 0, value: 0 },
        { offset: 0.5, value: 0.5 },
        { offset: 0.5, value: 1 },
      ],
    };
    const result = AnimationChannelSchema.safeParse(channel);
    expect(result.success).toBe(false);
  });

  it('requires at least 2 keyframes', () => {
    const channel = {
      ...validChannel,
      keyframes: [{ offset: 0, value: 0 }],
    };
    const result = AnimationChannelSchema.safeParse(channel);
    expect(result.success).toBe(false);
  });

  it('rejects empty keyframes array', () => {
    const channel = { ...validChannel, keyframes: [] };
    const result = AnimationChannelSchema.safeParse(channel);
    expect(result.success).toBe(false);
  });

  it('rejects duration of 0', () => {
    const result = AnimationChannelSchema.safeParse({
      ...validChannel,
      duration: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative duration', () => {
    const result = AnimationChannelSchema.safeParse({
      ...validChannel,
      duration: -1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts delay of 0', () => {
    const result = AnimationChannelSchema.safeParse({
      ...validChannel,
      delay: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative delay', () => {
    const result = AnimationChannelSchema.safeParse({
      ...validChannel,
      delay: -1,
    });
    expect(result.success).toBe(false);
  });
});
