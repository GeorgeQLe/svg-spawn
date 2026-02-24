import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateWithSchema, formatZodError } from '../../validation/schema-utils.js';
import { isOk, isErr, unwrap } from '../../validation/result.js';

const TestSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
});

describe('validateWithSchema()', () => {
  it('returns ok for valid data', () => {
    const result = validateWithSchema(TestSchema, { name: 'Alice', age: 30 });
    expect(isOk(result)).toBe(true);
    expect(unwrap(result)).toEqual({ name: 'Alice', age: 30 });
  });

  it('returns err for invalid data', () => {
    const result = validateWithSchema(TestSchema, { name: '', age: -1 });
    expect(isErr(result)).toBe(true);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(z.ZodError);
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('returns err when data is completely wrong type', () => {
    const result = validateWithSchema(TestSchema, 'not an object');
    expect(isErr(result)).toBe(true);
  });

  it('returns err when required fields are missing', () => {
    const result = validateWithSchema(TestSchema, {});
    expect(isErr(result)).toBe(true);
    if (!result.ok) {
      expect(result.error.issues.length).toBe(2); // name and age both missing
    }
  });
});

describe('formatZodError()', () => {
  it('produces a readable error string with field paths', () => {
    const result = validateWithSchema(TestSchema, { name: '', age: -1 });
    if (!result.ok) {
      const formatted = formatZodError(result.error);
      expect(formatted).toContain('name');
      expect(formatted).toContain('age');
      expect(typeof formatted).toBe('string');
    } else {
      expect.unreachable('Expected validation to fail');
    }
  });

  it('includes the path and message for each issue', () => {
    const schema = z.object({
      nested: z.object({
        value: z.number(),
      }),
    });
    const result = validateWithSchema(schema, { nested: { value: 'not a number' } });
    if (!result.ok) {
      const formatted = formatZodError(result.error);
      expect(formatted).toContain('nested.value');
    } else {
      expect.unreachable('Expected validation to fail');
    }
  });

  it('handles root-level errors', () => {
    const schema = z.string();
    const result = validateWithSchema(schema, 123);
    if (!result.ok) {
      const formatted = formatZodError(result.error);
      expect(formatted).toContain('(root)');
    } else {
      expect.unreachable('Expected validation to fail');
    }
  });
});
