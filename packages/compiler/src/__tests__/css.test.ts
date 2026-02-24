import { describe, it, expect } from 'vitest';
import { generateCss } from '../generators/css.js';
import type { BackendAssignment } from '../backend/select-backend.js';

function makeCssAssignment(
  nodeUid: string,
  property: string,
  overrides: Partial<BackendAssignment['channel']> = {},
): BackendAssignment {
  return {
    nodeUid,
    backend: 'css',
    channel: {
      property,
      keyframes: [
        { offset: 0, value: 0 },
        { offset: 1, value: 1 },
      ],
      duration: 500,
      delay: 0,
      repeatCount: 1,
      fill: 'forwards',
      compilationBackend: 'css',
      ...overrides,
    },
  };
}

describe('css generator', () => {
  it('generates valid @keyframes rule', () => {
    const css = generateCss([makeCssAssignment('el-1', 'opacity')]);
    expect(css).toContain('@keyframes svgs-el-1-opacity');
    expect(css).toContain('0%');
    expect(css).toContain('100%');
  });

  it('generates scoped animation names', () => {
    const css = generateCss([makeCssAssignment('my-uid', 'opacity')]);
    expect(css).toContain('svgs-my-uid-opacity');
  });

  it('includes prefers-reduced-motion media query', () => {
    const css = generateCss([makeCssAssignment('el-1', 'opacity')]);
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation: none');
  });

  it('handles multiple elements', () => {
    const css = generateCss([
      makeCssAssignment('el-1', 'opacity'),
      makeCssAssignment('el-2', 'opacity'),
    ]);
    expect(css).toContain('svgs-el-1-opacity');
    expect(css).toContain('svgs-el-2-opacity');
    expect(css).toContain('[data-uid="el-1"]');
    expect(css).toContain('[data-uid="el-2"]');
  });

  it('generates CSS selector with data-uid attribute', () => {
    const css = generateCss([makeCssAssignment('el-1', 'opacity')]);
    expect(css).toContain('[data-uid="el-1"]');
  });

  it('returns empty string when no CSS assignments', () => {
    const smilOnly: BackendAssignment = {
      nodeUid: 'el-1',
      backend: 'smil',
      channel: {
        property: 'd',
        keyframes: [
          { offset: 0, value: 'M0 0' },
          { offset: 1, value: 'M10 10' },
        ],
        duration: 500,
        delay: 0,
        repeatCount: 1,
        fill: 'forwards',
        compilationBackend: 'smil',
      },
    };
    const css = generateCss([smilOnly]);
    expect(css).toBe('');
  });

  it('handles transform sub-properties correctly', () => {
    const assignment = makeCssAssignment('el-1', 'transform:translateX', {
      keyframes: [
        { offset: 0, value: '-100px' },
        { offset: 1, value: '0px' },
      ],
    });
    const css = generateCss([assignment]);
    expect(css).toContain('transform: translateX(-100px)');
    expect(css).toContain('transform: translateX(0px)');
  });

  it('includes animation duration and fill mode', () => {
    const css = generateCss([makeCssAssignment('el-1', 'opacity')]);
    expect(css).toContain('500ms');
    expect(css).toContain('forwards');
  });
});
