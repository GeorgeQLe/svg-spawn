import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../prompts/system-prompt.js';

describe('buildSystemPrompt', () => {
  const systemPrompt = buildSystemPrompt();

  it('includes IR schema description', () => {
    expect(systemPrompt).toContain('AnimationPlan');
    expect(systemPrompt).toContain('svgDocumentId');
    expect(systemPrompt).toContain('groups');
    expect(systemPrompt).toContain('channels');
    expect(systemPrompt).toContain('metadata');
    expect(systemPrompt).toContain('keyframes');
  });

  it('includes effectType vocabulary', () => {
    expect(systemPrompt).toContain('bounce');
    expect(systemPrompt).toContain('fade');
    expect(systemPrompt).toContain('slide');
    expect(systemPrompt).toContain('rotate');
    expect(systemPrompt).toContain('scale');
    expect(systemPrompt).toContain('draw-on');
    expect(systemPrompt).toContain('pulse');
    expect(systemPrompt).toContain('shake');
    expect(systemPrompt).toContain('float');
    expect(systemPrompt).toContain('color-cycle');
  });

  it('includes output format instruction (JSON only)', () => {
    expect(systemPrompt).toContain('JSON');
    expect(systemPrompt).toMatch(/respond with ONLY/i);
  });

  it('includes animation rules', () => {
    expect(systemPrompt).toContain('Animation Rules');
    expect(systemPrompt).toContain('nodeUid');
    expect(systemPrompt).toContain('startTime');
    expect(systemPrompt).toContain('duration');
    expect(systemPrompt).toContain('ascending order');
  });
});
