import type { AnimationChannel, EffectType, Keyframe, FillMode } from '@svg-spawn/core';
import { CompilationError } from '../errors.js';

interface EffectTiming {
  duration: number;
  delay: number;
  repeatCount: number | 'indefinite';
  fill: FillMode;
}

type ChannelTemplate = (timing: EffectTiming) => AnimationChannel[];

function makeChannel(
  property: string,
  keyframes: Keyframe[],
  timing: EffectTiming,
  backend: 'smil' | 'css' | 'auto' = 'auto',
): AnimationChannel {
  return {
    property,
    keyframes,
    duration: timing.duration,
    delay: timing.delay,
    repeatCount: timing.repeatCount,
    fill: timing.fill,
    compilationBackend: backend,
  };
}

const EFFECT_TEMPLATES: Record<EffectType, ChannelTemplate> = {
  bounce: (timing) => [
    makeChannel(
      'transform:translateY',
      [
        { offset: 0, value: '0px' },
        { offset: 0.5, value: '-20px' },
        { offset: 1, value: '0px' },
      ],
      timing,
      'css',
    ),
  ],

  fade: (timing) => [
    makeChannel(
      'opacity',
      [
        { offset: 0, value: 0 },
        { offset: 1, value: 1 },
      ],
      timing,
      'auto',
    ),
  ],

  slide: (timing) => [
    makeChannel(
      'transform:translateX',
      [
        { offset: 0, value: '-100px' },
        { offset: 1, value: '0px' },
      ],
      timing,
      'css',
    ),
  ],

  rotate: (timing) => [
    makeChannel(
      'transform:rotate',
      [
        { offset: 0, value: '0deg' },
        { offset: 1, value: '360deg' },
      ],
      timing,
      'auto',
    ),
  ],

  scale: (timing) => [
    makeChannel(
      'transform:scale',
      [
        { offset: 0, value: 0 },
        { offset: 1, value: 1 },
      ],
      timing,
      'auto',
    ),
  ],

  'draw-on': (timing) => [
    makeChannel(
      'stroke-dashoffset',
      [
        { offset: 0, value: 1 },
        { offset: 1, value: 0 },
      ],
      timing,
      'smil',
    ),
  ],

  pulse: (timing) => [
    makeChannel(
      'transform:scale',
      [
        { offset: 0, value: 1 },
        { offset: 0.5, value: 1.1 },
        { offset: 1, value: 1 },
      ],
      timing,
      'css',
    ),
  ],

  shake: (timing) => [
    makeChannel(
      'transform:translateX',
      [
        { offset: 0, value: '0px' },
        { offset: 0.25, value: '-5px' },
        { offset: 0.5, value: '5px' },
        { offset: 0.75, value: '-5px' },
        { offset: 1, value: '0px' },
      ],
      timing,
      'css',
    ),
  ],

  float: (timing) => [
    makeChannel(
      'transform:translateY',
      [
        { offset: 0, value: '0px' },
        { offset: 0.5, value: '-10px' },
        { offset: 1, value: '0px' },
      ],
      { ...timing, repeatCount: 'indefinite' },
      'css',
    ),
  ],

  'color-cycle': (timing) => [
    makeChannel(
      'fill',
      [
        { offset: 0, value: '#ff0000' },
        { offset: 0.33, value: '#00ff00' },
        { offset: 0.66, value: '#0000ff' },
        { offset: 1, value: '#ff0000' },
      ],
      timing,
      'auto',
    ),
  ],
};

/**
 * Given an EffectType, return the channel template function.
 * Throws CompilationError for unknown effect types.
 */
export function getEffectChannels(
  effectType: EffectType,
  timing: EffectTiming,
): AnimationChannel[] {
  const template = EFFECT_TEMPLATES[effectType];
  if (!template) {
    throw new CompilationError(`Unknown effect type: ${effectType}`, 'UNKNOWN_EFFECT');
  }
  return template(timing);
}

/**
 * Check if an effect type is known.
 */
export function isKnownEffect(effectType: string): effectType is EffectType {
  return effectType in EFFECT_TEMPLATES;
}
