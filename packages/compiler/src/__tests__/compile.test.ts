import { describe, it, expect } from 'vitest';
import { compile } from '../compile.js';
import {
  createTestDocument,
  createFadePlan,
  createBouncePlan,
  createDrawOnPlan,
  createMixedPlan,
  createEmptyPlan,
} from './fixtures.js';

describe('compile (integration)', () => {
  const doc = createTestDocument();

  it('fade animation produces opacity animation in output', () => {
    const result = compile(createFadePlan(), doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Fade uses CSS for opacity
    expect(result.value).toContain('opacity');
    expect(result.value).toContain('@keyframes');
  });

  it('bounce produces transform animation', () => {
    const result = compile(createBouncePlan(), doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('transform');
    expect(result.value).toContain('translateY');
  });

  it('draw-on produces SMIL animation', () => {
    const result = compile(createDrawOnPlan(), doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('<animate');
    expect(result.value).toContain('stroke-dashoffset');
  });

  it('mixed SMIL+CSS works together', () => {
    const result = compile(createMixedPlan(), doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Should have both CSS (for fade/opacity) and SMIL (for draw-on/stroke-dashoffset)
    expect(result.value).toContain('<style>');
    expect(result.value).toContain('@keyframes');
    expect(result.value).toContain('<animate');
    expect(result.value).toContain('stroke-dashoffset');
  });

  it('empty plan → unchanged SVG (no animations added)', () => {
    const result = compile(createEmptyPlan(), doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // No style block, no animate elements
    expect(result.value).not.toContain('<style>');
    expect(result.value).not.toContain('<animate');
    // But still a valid SVG
    expect(result.value).toContain('<svg');
    expect(result.value).toContain('</svg>');
  });

  it('deterministic: same input = identical output', () => {
    const plan = createMixedPlan();
    const result1 = compile(plan, doc);
    const result2 = compile(plan, doc);
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    if (!result1.ok || !result2.ok) return;
    expect(result1.value).toBe(result2.value);
  });

  it('output is well-formed XML', () => {
    const result = compile(createFadePlan(), doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('<?xml version="1.0"');
    expect(result.value).toContain('<svg');
    expect(result.value).toContain('</svg>');
  });

  it('plan with nonexistent target fails', () => {
    const plan = {
      ...createFadePlan(),
      groups: [
        {
          id: 'bad',
          name: 'Bad',
          effectType: 'fade' as const,
          targets: [{ type: 'element' as const, nodeUid: 'missing' }],
          startTime: 0,
          duration: 500,
          easingPreset: 'ease-out' as const,
          repeatCount: 1,
        },
      ],
    };
    const result = compile(plan, doc);
    expect(result.ok).toBe(false);
  });

  it('output contains data-uid for animated elements', () => {
    const result = compile(createFadePlan(), doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('data-uid="circle-1"');
  });

  it('output preserves viewBox', () => {
    const result = compile(createFadePlan(), doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('viewBox="0 0 100 100"');
  });
});
