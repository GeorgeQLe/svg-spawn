import { describe, it, expect } from 'vitest';
import { ok, err, type Result, type AnimationPlan } from '@svg-spawn/core';
import { MockAiClient } from '../gemini/client.js';
import { AiError } from '../errors.js';
import { generateWithRetry } from '../retry/retry-strategy.js';

const validPlanJson = JSON.stringify({
  id: 'plan-1',
  svgDocumentId: 'doc-1',
  groups: [
    {
      id: 'group-1',
      name: 'Fade',
      effectType: 'fade',
      targets: [{ type: 'element', nodeUid: 'node-1' }],
      startTime: 0,
      duration: 1,
      easingPreset: 'ease-in-out',
      repeatCount: 1,
    },
  ],
  channels: {
    'group-1': [
      {
        property: 'opacity',
        keyframes: [
          { offset: 0, value: 0 },
          { offset: 1, value: 1 },
        ],
        duration: 1,
        delay: 0,
        repeatCount: 1,
        fill: 'forwards',
        compilationBackend: 'auto',
      },
    ],
  },
  metadata: {
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelId: 'gemini-pro',
    userPrompt: 'Fade in',
  },
});

const validPlan: AnimationPlan = JSON.parse(validPlanJson) as AnimationPlan;

function makeValidateSuccess(_response: string): Result<AnimationPlan, AiError> {
  return ok(validPlan);
}

function makeValidateFailure(_response: string): Result<AnimationPlan, AiError> {
  return err(new AiError('Validation failed: missing fields', 'validation'));
}

let validateCallCount = 0;

function makeValidateFailThenSucceed(response: string): Result<AnimationPlan, AiError> {
  validateCallCount++;
  if (validateCallCount <= 1) {
    return err(new AiError('Validation failed on first attempt', 'validation'));
  }
  return ok(JSON.parse(response) as AnimationPlan);
}

describe('generateWithRetry', () => {
  it('no retry on first success', async () => {
    const client = new MockAiClient([ok(validPlanJson)]);

    const result = await generateWithRetry(
      client,
      'system prompt',
      'user prompt',
      makeValidateSuccess,
      { maxAttempts: 3 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('plan-1');
    }
  });

  it('retries on validation failure and succeeds', async () => {
    validateCallCount = 0;
    const client = new MockAiClient([
      ok('invalid response'),
      ok(validPlanJson),
    ]);

    const result = await generateWithRetry(
      client,
      'system prompt',
      'user prompt',
      makeValidateFailThenSucceed,
      { maxAttempts: 3 },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('plan-1');
    }
  });

  it('gives up after maxAttempts', async () => {
    const client = new MockAiClient([
      ok('bad-1'),
      ok('bad-2'),
      ok('bad-3'),
    ]);

    const result = await generateWithRetry(
      client,
      'system prompt',
      'user prompt',
      makeValidateFailure,
      { maxAttempts: 3 },
    );

    expect(result.ok).toBe(false);
  });

  it('returns last error after exhausting retries', async () => {
    const client = new MockAiClient([
      ok('bad-1'),
      ok('bad-2'),
    ]);

    const result = await generateWithRetry(
      client,
      'system prompt',
      'user prompt',
      makeValidateFailure,
      { maxAttempts: 2 },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AiError);
      expect(result.error.code).toBe('validation');
      expect(result.error.message).toContain('Validation failed');
    }
  });
});
