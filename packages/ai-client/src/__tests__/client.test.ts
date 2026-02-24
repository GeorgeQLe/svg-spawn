import { describe, it, expect } from 'vitest';
import { ok, err } from '@svg-spawn/core';
import { MockAiClient, GeminiClient } from '../gemini/client.js';
import { AiError } from '../errors.js';

describe('MockAiClient', () => {
  it('returns queued responses in order', async () => {
    const client = new MockAiClient([
      ok('response-1'),
      ok('response-2'),
      ok('response-3'),
    ]);

    const r1 = await client.generateContent('prompt-1', 'system');
    const r2 = await client.generateContent('prompt-2', 'system');
    const r3 = await client.generateContent('prompt-3', 'system');

    expect(r1).toEqual({ ok: true, value: 'response-1' });
    expect(r2).toEqual({ ok: true, value: 'response-2' });
    expect(r3).toEqual({ ok: true, value: 'response-3' });
  });

  it('returns error when queue is empty', async () => {
    const client = new MockAiClient([ok('only-one')]);

    await client.generateContent('prompt', 'system');
    const result = await client.generateContent('prompt', 'system');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AiError);
      expect(result.error.code).toBe('unknown');
      expect(result.error.message).toContain('no more responses');
    }
  });

  it('handles rate limit error', async () => {
    const client = new MockAiClient([
      err(new AiError('Rate limit exceeded', 'rate_limit')),
    ]);

    const result = await client.generateContent('prompt', 'system');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('rate_limit');
      expect(result.error.message).toBe('Rate limit exceeded');
    }
  });

  it('handles auth error', async () => {
    const client = new MockAiClient([
      err(new AiError('Invalid API key', 'auth')),
    ]);

    const result = await client.generateContent('prompt', 'system');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('auth');
      expect(result.error.message).toBe('Invalid API key');
    }
  });
});

describe('GeminiClient', () => {
  it('constructs with apiKey and modelId', () => {
    const client = new GeminiClient('test-api-key', 'gemini-pro');
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(GeminiClient);
  });
});
