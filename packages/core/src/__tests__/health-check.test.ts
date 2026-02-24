import { describe, it, expect } from 'vitest';
import { healthCheck } from '../index.js';

describe('core healthCheck', () => {
  it('returns ok', () => {
    expect(healthCheck()).toBe('ok');
  });
});
