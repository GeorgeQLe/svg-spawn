import type { EasingPreset } from '@svg-spawn/core';

export interface EasingDescriptor {
  css: string;
  smilKeySplines: string;
}

const EASING_MAP: Record<EasingPreset, EasingDescriptor> = {
  linear: {
    css: 'linear',
    smilKeySplines: '0 0 1 1',
  },
  'ease-in': {
    css: 'ease-in',
    smilKeySplines: '0.42 0 1 1',
  },
  'ease-out': {
    css: 'ease-out',
    smilKeySplines: '0 0 0.58 1',
  },
  'ease-in-out': {
    css: 'ease-in-out',
    smilKeySplines: '0.42 0 0.58 1',
  },
  spring: {
    css: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    smilKeySplines: '0.175 0.885 0.32 1.275',
  },
  bounce: {
    css: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smilKeySplines: '0.34 1.56 0.64 1',
  },
};

/**
 * Look up the CSS timing-function and SMIL keySplines for a given easing preset.
 */
export function getEasing(preset: EasingPreset): EasingDescriptor {
  return EASING_MAP[preset];
}

/**
 * Build a SMIL `keySplines` attribute value for N keyframes.
 * keySplines needs (N-1) segments.
 */
export function buildSmilKeySplines(preset: EasingPreset, segmentCount: number): string {
  const spline = EASING_MAP[preset].smilKeySplines;
  return Array(segmentCount).fill(spline).join('; ');
}
