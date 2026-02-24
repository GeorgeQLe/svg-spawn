import { describe, it, expect } from 'vitest';
import { assemble } from '../assembler.js';
import { createTestDocument } from './fixtures.js';
import type { SmilElement } from '../generators/smil.js';

describe('assembler', () => {
  it('SMIL elements inserted as children of targets', () => {
    const doc = createTestDocument();
    const smilElements: SmilElement[] = [
      {
        nodeUid: 'circle-1',
        elementString: '<animate attributeName="opacity" values="0;1" dur="500ms"/>',
      },
    ];
    const result = assemble(doc, smilElements, '');
    expect(result).toContain('<animate attributeName="opacity" values="0;1" dur="500ms"/>');
    // The animate element should be inside the circle's serialization
    const circleIdx = result.indexOf('<circle');
    const animateIdx = result.indexOf('<animate');
    const circleCloseIdx = result.indexOf('</circle>');
    expect(animateIdx).toBeGreaterThan(circleIdx);
    expect(animateIdx).toBeLessThan(circleCloseIdx);
  });

  it('<style> element inserted in SVG', () => {
    const doc = createTestDocument();
    const css = '@keyframes test { 0% { opacity: 0; } 100% { opacity: 1; } }';
    const result = assemble(doc, [], css);
    expect(result).toContain('<style>');
    expect(result).toContain('@keyframes test');
    // style should be a child of svg
    const svgIdx = result.indexOf('<svg');
    const styleIdx = result.indexOf('<style>');
    expect(styleIdx).toBeGreaterThan(svgIdx);
  });

  it('data-uid attributes added to animated elements', () => {
    const doc = createTestDocument();
    const smilElements: SmilElement[] = [
      {
        nodeUid: 'rect-1',
        elementString: '<animate attributeName="width" values="0;80" dur="500ms"/>',
      },
    ];
    const result = assemble(doc, smilElements, '');
    expect(result).toContain('data-uid="rect-1"');
  });

  it('data-uid attributes added for CSS-targeted elements', () => {
    const doc = createTestDocument();
    const css = '[data-uid="circle-1"] { animation: test 500ms; }';
    const result = assemble(doc, [], css);
    expect(result).toContain('data-uid="circle-1"');
  });

  it('output is well-formed XML', () => {
    const doc = createTestDocument();
    const result = assemble(doc, [], '');
    expect(result).toContain('<?xml version="1.0"');
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
    expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('preserves viewBox', () => {
    const doc = createTestDocument();
    const result = assemble(doc, [], '');
    expect(result).toContain('viewBox="0 0 100 100"');
  });

  it('preserves width and height', () => {
    const doc = createTestDocument();
    const result = assemble(doc, [], '');
    expect(result).toContain('width="100"');
    expect(result).toContain('height="100"');
  });

  it('handles empty SMIL and CSS', () => {
    const doc = createTestDocument();
    const result = assemble(doc, [], '');
    expect(result).toContain('<svg');
    expect(result).not.toContain('<style>');
  });
});
