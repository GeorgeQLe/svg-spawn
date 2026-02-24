import { describe, it, expect } from 'vitest';
import { ElementFingerprintSchema } from '../../svg/fingerprint.js';

describe('ElementFingerprintSchema', () => {
  it('parses a valid fingerprint with all fields', () => {
    const input = {
      tagName: 'rect',
      ancestryPath: ['svg', 'g', 'rect'],
      bbox: { x: 0, y: 0, width: 100, height: 50 },
      centroid: { x: 50, y: 25 },
      area: 5000,
      pathLength: 300,
      fill: '#ff0000',
      stroke: '#000000',
      opacity: 0.8,
    };

    const result = ElementFingerprintSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('parses a valid fingerprint with only required fields', () => {
    const input = {
      tagName: 'circle',
      ancestryPath: ['svg', 'circle'],
    };

    const result = ElementFingerprintSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('allows optional fields to be omitted', () => {
    const input = {
      tagName: 'path',
      ancestryPath: ['svg', 'g', 'path'],
      fill: '#00ff00',
    };

    const result = ElementFingerprintSchema.parse(input);
    expect(result.bbox).toBeUndefined();
    expect(result.centroid).toBeUndefined();
    expect(result.area).toBeUndefined();
    expect(result.pathLength).toBeUndefined();
    expect(result.stroke).toBeUndefined();
    expect(result.opacity).toBeUndefined();
    expect(result.fill).toBe('#00ff00');
  });

  it('rejects opacity less than 0', () => {
    const input = {
      tagName: 'rect',
      ancestryPath: ['svg', 'rect'],
      opacity: -0.1,
    };

    expect(() => ElementFingerprintSchema.parse(input)).toThrow();
  });

  it('rejects opacity greater than 1', () => {
    const input = {
      tagName: 'rect',
      ancestryPath: ['svg', 'rect'],
      opacity: 1.5,
    };

    expect(() => ElementFingerprintSchema.parse(input)).toThrow();
  });

  it('accepts opacity of exactly 0', () => {
    const input = {
      tagName: 'rect',
      ancestryPath: ['svg', 'rect'],
      opacity: 0,
    };

    const result = ElementFingerprintSchema.parse(input);
    expect(result.opacity).toBe(0);
  });

  it('accepts opacity of exactly 1', () => {
    const input = {
      tagName: 'rect',
      ancestryPath: ['svg', 'rect'],
      opacity: 1,
    };

    const result = ElementFingerprintSchema.parse(input);
    expect(result.opacity).toBe(1);
  });
});
