import { describe, it, expect } from 'vitest';
import { generateSmil } from '../generators/smil.js';
import type { BackendAssignment } from '../backend/select-backend.js';

function makeAssignment(
  overrides: Partial<BackendAssignment> & { nodeUid?: string } = {},
): BackendAssignment {
  return {
    nodeUid: 'el-1',
    backend: 'smil',
    channel: {
      property: 'stroke-dashoffset',
      keyframes: [
        { offset: 0, value: 1 },
        { offset: 1, value: 0 },
      ],
      duration: 1000,
      delay: 0,
      repeatCount: 1,
      fill: 'forwards',
      compilationBackend: 'smil',
    },
    ...overrides,
  };
}

describe('smil generator', () => {
  it('generates valid <animate> element', () => {
    const assignment = makeAssignment();
    const elements = generateSmil([assignment]);
    expect(elements).toHaveLength(1);
    const el = elements[0]!;
    expect(el.nodeUid).toBe('el-1');
    expect(el.elementString).toContain('<animate');
    expect(el.elementString).toContain('attributeName="stroke-dashoffset"');
    expect(el.elementString).toContain('values="1;0"');
    expect(el.elementString).toContain('dur="1000ms"');
  });

  it('generates valid <animateTransform> element', () => {
    const assignment = makeAssignment({
      channel: {
        property: 'transform:rotate',
        keyframes: [
          { offset: 0, value: '0deg' },
          { offset: 1, value: '360deg' },
        ],
        duration: 1000,
        delay: 0,
        repeatCount: 1,
        fill: 'forwards',
        compilationBackend: 'smil',
      },
    });
    const elements = generateSmil([assignment]);
    expect(elements).toHaveLength(1);
    expect(elements[0]!.elementString).toContain('<animateTransform');
    expect(elements[0]!.elementString).toContain('attributeName="transform"');
    expect(elements[0]!.elementString).toContain('type="rotate"');
  });

  it('handles repeatCount "indefinite"', () => {
    const assignment = makeAssignment({
      channel: {
        property: 'stroke-dashoffset',
        keyframes: [
          { offset: 0, value: 1 },
          { offset: 1, value: 0 },
        ],
        duration: 1000,
        delay: 0,
        repeatCount: 'indefinite',
        fill: 'forwards',
        compilationBackend: 'smil',
      },
    });
    const elements = generateSmil([assignment]);
    expect(elements[0]!.elementString).toContain('repeatCount="indefinite"');
  });

  it('handles delay via begin attribute', () => {
    const assignment = makeAssignment({
      channel: {
        property: 'stroke-dashoffset',
        keyframes: [
          { offset: 0, value: 1 },
          { offset: 1, value: 0 },
        ],
        duration: 1000,
        delay: 500,
        repeatCount: 1,
        fill: 'forwards',
        compilationBackend: 'smil',
      },
    });
    const elements = generateSmil([assignment]);
    expect(elements[0]!.elementString).toContain('begin="500ms"');
  });

  it('includes keySplines for easing', () => {
    const assignment = makeAssignment();
    const elements = generateSmil([assignment]);
    expect(elements[0]!.elementString).toContain('keySplines=');
    expect(elements[0]!.elementString).toContain('calcMode="spline"');
  });

  it('only processes SMIL-backend assignments', () => {
    const cssAssignment: BackendAssignment = {
      nodeUid: 'el-1',
      backend: 'css',
      channel: {
        property: 'opacity',
        keyframes: [
          { offset: 0, value: 0 },
          { offset: 1, value: 1 },
        ],
        duration: 500,
        delay: 0,
        repeatCount: 1,
        fill: 'forwards',
        compilationBackend: 'css',
      },
    };
    const elements = generateSmil([cssAssignment]);
    expect(elements).toHaveLength(0);
  });
});
