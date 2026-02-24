import { describe, it, expect } from 'vitest';
import { parseAiResponse } from '../response/parse-response.js';

describe('parseAiResponse', () => {
  it('extracts valid JSON', () => {
    const response = '{"id": "plan-1", "name": "test"}';
    const result = parseAiResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ id: 'plan-1', name: 'test' });
    }
  });

  it('handles markdown-wrapped JSON', () => {
    const response = '```json\n{"id": "plan-1", "name": "test"}\n```';
    const result = parseAiResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ id: 'plan-1', name: 'test' });
    }
  });

  it('errors on no JSON found', () => {
    const response = 'This is just plain text without any JSON content.';
    const result = parseAiResponse(response);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('parse');
      expect(result.error.message).toContain('No JSON found');
    }
  });

  it('handles text before and after JSON', () => {
    const response = 'Here is the animation plan:\n{"id": "plan-1", "groups": []}\nThat should work!';
    const result = parseAiResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ id: 'plan-1', groups: [] });
    }
  });

  it('errors on invalid JSON syntax', () => {
    const response = '{"id": "plan-1", BROKEN';
    const result = parseAiResponse(response);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('parse');
    }
  });
});
