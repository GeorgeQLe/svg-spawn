import { describe, it, expect } from 'vitest';
import { getEffectChannels, isKnownEffect } from '../group-compiler/effect-library.js';
import { CompilationError } from '../errors.js';
import type { EffectType } from '@svg-spawn/core';

const baseTiming = {
  duration: 500,
  delay: 0,
  repeatCount: 1 as number | 'indefinite',
  fill: 'forwards' as const,
};

describe('effect-library', () => {
  it('bounce produces translateY keyframes', () => {
    const channels = getEffectChannels('bounce', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('transform:translateY');
    expect(channels[0]!.keyframes).toHaveLength(3);
    expect(channels[0]!.keyframes[0]!.value).toBe('0px');
    expect(channels[0]!.keyframes[1]!.value).toBe('-20px');
    expect(channels[0]!.keyframes[2]!.value).toBe('0px');
  });

  it('fade produces opacity 0→1 channel', () => {
    const channels = getEffectChannels('fade', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('opacity');
    expect(channels[0]!.keyframes[0]!.value).toBe(0);
    expect(channels[0]!.keyframes[1]!.value).toBe(1);
  });

  it('slide produces translateX keyframes', () => {
    const channels = getEffectChannels('slide', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('transform:translateX');
    expect(channels[0]!.keyframes[0]!.value).toBe('-100px');
    expect(channels[0]!.keyframes[1]!.value).toBe('0px');
  });

  it('rotate produces rotate transform', () => {
    const channels = getEffectChannels('rotate', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('transform:rotate');
    expect(channels[0]!.keyframes[0]!.value).toBe('0deg');
    expect(channels[0]!.keyframes[1]!.value).toBe('360deg');
  });

  it('scale produces scale transform', () => {
    const channels = getEffectChannels('scale', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('transform:scale');
    expect(channels[0]!.keyframes[0]!.value).toBe(0);
    expect(channels[0]!.keyframes[1]!.value).toBe(1);
  });

  it('draw-on produces stroke-dashoffset channel', () => {
    const channels = getEffectChannels('draw-on', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('stroke-dashoffset');
    expect(channels[0]!.keyframes[0]!.value).toBe(1);
    expect(channels[0]!.keyframes[1]!.value).toBe(0);
    expect(channels[0]!.compilationBackend).toBe('smil');
  });

  it('pulse produces scale keyframes', () => {
    const channels = getEffectChannels('pulse', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('transform:scale');
    expect(channels[0]!.keyframes).toHaveLength(3);
    expect(channels[0]!.keyframes[0]!.value).toBe(1);
    expect(channels[0]!.keyframes[1]!.value).toBe(1.1);
    expect(channels[0]!.keyframes[2]!.value).toBe(1);
  });

  it('shake produces translateX keyframes', () => {
    const channels = getEffectChannels('shake', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('transform:translateX');
    expect(channels[0]!.keyframes).toHaveLength(5);
  });

  it('float produces translateY with indefinite repeat', () => {
    const channels = getEffectChannels('float', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('transform:translateY');
    expect(channels[0]!.repeatCount).toBe('indefinite');
  });

  it('color-cycle produces fill channel', () => {
    const channels = getEffectChannels('color-cycle', baseTiming);
    expect(channels).toHaveLength(1);
    expect(channels[0]!.property).toBe('fill');
    expect(channels[0]!.keyframes.length).toBeGreaterThanOrEqual(3);
  });

  it('unknown effectType throws CompilationError', () => {
    expect(() => {
      getEffectChannels('unknown-effect' as EffectType, baseTiming);
    }).toThrow(CompilationError);
  });

  it('isKnownEffect returns true for valid effects', () => {
    expect(isKnownEffect('bounce')).toBe(true);
    expect(isKnownEffect('fade')).toBe(true);
    expect(isKnownEffect('slide')).toBe(true);
  });

  it('isKnownEffect returns false for unknown effects', () => {
    expect(isKnownEffect('unknown')).toBe(false);
  });
});
