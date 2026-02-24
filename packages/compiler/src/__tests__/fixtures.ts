import type { SvgDocument, SvgElement, AnimationPlan, AnimationGroup } from '@svg-spawn/core';

/**
 * A minimal SvgDocument with a few elements and known nodeUids for testing.
 */
export function createTestDocument(): SvgDocument {
  const circle: SvgElement = {
    nodeUid: 'circle-1',
    tagName: 'circle',
    attributes: { cx: '50', cy: '50', r: '25', fill: 'red' },
    children: [],
    fingerprint: {
      tagName: 'circle',
      ancestryPath: ['svg'],
      pathLength: 157,
    },
  };

  const rect: SvgElement = {
    nodeUid: 'rect-1',
    tagName: 'rect',
    attributes: { x: '10', y: '10', width: '80', height: '40', fill: 'blue' },
    children: [],
    fingerprint: {
      tagName: 'rect',
      ancestryPath: ['svg'],
    },
  };

  const path: SvgElement = {
    nodeUid: 'path-1',
    tagName: 'path',
    attributes: { d: 'M10 10 L90 90', stroke: 'black', fill: 'none' },
    children: [],
    fingerprint: {
      tagName: 'path',
      ancestryPath: ['svg'],
      pathLength: 113,
    },
  };

  const group: SvgElement = {
    nodeUid: 'g-1',
    tagName: 'g',
    attributes: {},
    children: [circle, rect],
  };

  const root: SvgElement = {
    nodeUid: 'svg-root',
    tagName: 'svg',
    attributes: {
      xmlns: 'http://www.w3.org/2000/svg',
    },
    children: [group, path],
  };

  return {
    root,
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    width: 100,
    height: 100,
    namespaces: {},
  };
}

/**
 * Create a minimal AnimationPlan with a fade effect on circle-1.
 */
export function createFadePlan(): AnimationPlan {
  return {
    id: 'plan-1',
    svgDocumentId: 'doc-1',
    groups: [
      {
        id: 'group-1',
        name: 'Fade In Circle',
        effectType: 'fade',
        targets: [{ type: 'element', nodeUid: 'circle-1' }],
        startTime: 0,
        duration: 500,
        easingPreset: 'ease-out',
        repeatCount: 1,
      },
    ],
    channels: {},
    metadata: {
      generatedAt: '2025-01-01T00:00:00Z',
      modelId: 'test',
      userPrompt: 'fade in the circle',
    },
  };
}

/**
 * Create an AnimationPlan with a bounce effect on rect-1.
 */
export function createBouncePlan(): AnimationPlan {
  return {
    id: 'plan-2',
    svgDocumentId: 'doc-1',
    groups: [
      {
        id: 'group-bounce',
        name: 'Bounce Rect',
        effectType: 'bounce',
        targets: [{ type: 'element', nodeUid: 'rect-1' }],
        startTime: 200,
        duration: 800,
        easingPreset: 'ease-out',
        repeatCount: 1,
      },
    ],
    channels: {},
    metadata: {
      generatedAt: '2025-01-01T00:00:00Z',
      modelId: 'test',
      userPrompt: 'bounce the rect',
    },
  };
}

/**
 * Create a plan with a draw-on effect on path-1 (SMIL).
 */
export function createDrawOnPlan(): AnimationPlan {
  return {
    id: 'plan-3',
    svgDocumentId: 'doc-1',
    groups: [
      {
        id: 'group-draw',
        name: 'Draw Path',
        effectType: 'draw-on',
        targets: [{ type: 'element', nodeUid: 'path-1' }],
        startTime: 0,
        duration: 1000,
        easingPreset: 'linear',
        repeatCount: 1,
      },
    ],
    channels: {},
    metadata: {
      generatedAt: '2025-01-01T00:00:00Z',
      modelId: 'test',
      userPrompt: 'draw the path',
    },
  };
}

/**
 * Create a plan with mixed CSS + SMIL effects.
 */
export function createMixedPlan(): AnimationPlan {
  return {
    id: 'plan-mixed',
    svgDocumentId: 'doc-1',
    groups: [
      {
        id: 'group-fade',
        name: 'Fade Circle',
        effectType: 'fade',
        targets: [{ type: 'element', nodeUid: 'circle-1' }],
        startTime: 0,
        duration: 500,
        easingPreset: 'ease-in',
        repeatCount: 1,
      },
      {
        id: 'group-draw',
        name: 'Draw Path',
        effectType: 'draw-on',
        targets: [{ type: 'element', nodeUid: 'path-1' }],
        startTime: 100,
        duration: 1000,
        easingPreset: 'linear',
        repeatCount: 1,
      },
    ],
    channels: {},
    metadata: {
      generatedAt: '2025-01-01T00:00:00Z',
      modelId: 'test',
      userPrompt: 'fade and draw',
    },
  };
}

/**
 * Create an empty plan (no groups, no channels).
 */
export function createEmptyPlan(): AnimationPlan {
  return {
    id: 'plan-empty',
    svgDocumentId: 'doc-1',
    groups: [],
    channels: {},
    metadata: {
      generatedAt: '2025-01-01T00:00:00Z',
      modelId: 'test',
      userPrompt: 'nothing',
    },
  };
}

/**
 * Create a single AnimationGroup with custom parameters.
 */
export function createGroup(overrides: Partial<AnimationGroup> = {}): AnimationGroup {
  return {
    id: 'test-group',
    name: 'Test Group',
    effectType: 'fade',
    targets: [{ type: 'element', nodeUid: 'circle-1' }],
    startTime: 0,
    duration: 500,
    easingPreset: 'ease-out',
    repeatCount: 1,
    ...overrides,
  };
}
