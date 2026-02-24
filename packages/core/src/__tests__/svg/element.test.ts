import { describe, it, expect } from 'vitest';
import { SvgElementSchema } from '../../svg/element.js';

describe('SvgElementSchema', () => {
  it('parses a valid element with no children', () => {
    const input = {
      nodeUid: 'node-1',
      tagName: 'rect',
      attributes: { x: '10', y: '20', width: '100', height: '50' },
      children: [],
    };

    const result = SvgElementSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('parses a valid element with textContent', () => {
    const input = {
      nodeUid: 'node-text',
      tagName: 'text',
      attributes: { x: '0', y: '15' },
      children: [],
      textContent: 'Hello World',
    };

    const result = SvgElementSchema.parse(input);
    expect(result.textContent).toBe('Hello World');
  });

  it('parses nested children correctly', () => {
    const input = {
      nodeUid: 'root',
      tagName: 'svg',
      attributes: { xmlns: 'http://www.w3.org/2000/svg' },
      children: [
        {
          nodeUid: 'group-1',
          tagName: 'g',
          attributes: { id: 'layer1' },
          children: [
            {
              nodeUid: 'rect-1',
              tagName: 'rect',
              attributes: { x: '0', y: '0', width: '50', height: '50' },
              children: [],
            },
            {
              nodeUid: 'circle-1',
              tagName: 'circle',
              attributes: { cx: '25', cy: '25', r: '10' },
              children: [],
            },
          ],
        },
      ],
    };

    const result = SvgElementSchema.parse(input);
    expect(result.children).toHaveLength(1);
    expect(result.children[0].tagName).toBe('g');
    expect(result.children[0].children).toHaveLength(2);
    expect(result.children[0].children[0].tagName).toBe('rect');
    expect(result.children[0].children[1].tagName).toBe('circle');
  });

  it('parses an element with a fingerprint', () => {
    const input = {
      nodeUid: 'node-fp',
      tagName: 'rect',
      attributes: {},
      children: [],
      fingerprint: {
        tagName: 'rect',
        ancestryPath: ['svg', 'g', 'rect'],
        fill: '#ff0000',
      },
    };

    const result = SvgElementSchema.parse(input);
    expect(result.fingerprint).toBeDefined();
    expect(result.fingerprint!.tagName).toBe('rect');
    expect(result.fingerprint!.fill).toBe('#ff0000');
  });

  it('rejects nodeUid that is empty', () => {
    const input = {
      nodeUid: '',
      tagName: 'rect',
      attributes: {},
      children: [],
    };

    expect(() => SvgElementSchema.parse(input)).toThrow();
  });

  it('rejects tagName that is empty', () => {
    const input = {
      nodeUid: 'node-1',
      tagName: '',
      attributes: {},
      children: [],
    };

    expect(() => SvgElementSchema.parse(input)).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => SvgElementSchema.parse({})).toThrow();
    expect(() => SvgElementSchema.parse({ nodeUid: 'a' })).toThrow();
  });
});
