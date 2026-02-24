import { describe, it, expect } from 'vitest';
import {
  generateAnimationPlan,
  GeminiClient,
  MockAiClient,
  AiError,
} from '../index.js';

describe('ai-client exports', () => {
  it('exports all key symbols', () => {
    expect(generateAnimationPlan).toBeDefined();
    expect(GeminiClient).toBeDefined();
    expect(MockAiClient).toBeDefined();
    expect(AiError).toBeDefined();
  });
});
