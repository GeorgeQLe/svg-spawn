import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, unwrap, mapResult, type Result } from '../../validation/result.js';

describe('Result utilities', () => {
  describe('ok()', () => {
    it('creates a success result', () => {
      const result = ok(42);
      expect(result).toEqual({ ok: true, value: 42 });
    });

    it('can be unwrapped to retrieve the value', () => {
      const result = ok('hello');
      expect(unwrap(result)).toBe('hello');
    });
  });

  describe('err()', () => {
    it('creates an error result', () => {
      const error = new Error('something went wrong');
      const result = err(error);
      expect(result).toEqual({ ok: false, error });
    });

    it('causes unwrap to throw the contained error', () => {
      const error = new Error('boom');
      const result = err(error);
      expect(() => unwrap(result)).toThrow('boom');
    });
  });

  describe('isOk()', () => {
    it('returns true for success results', () => {
      expect(isOk(ok(1))).toBe(true);
    });

    it('returns false for error results', () => {
      expect(isOk(err(new Error('fail')))).toBe(false);
    });

    it('narrows the type so value is accessible', () => {
      const result: Result<number, Error> = ok(10);
      if (isOk(result)) {
        // If type narrowing works, result.value is accessible
        const value: number = result.value;
        expect(value).toBe(10);
      } else {
        // Should not reach here
        expect.unreachable('Expected ok result');
      }
    });
  });

  describe('isErr()', () => {
    it('returns true for error results', () => {
      expect(isErr(err('bad'))).toBe(true);
    });

    it('returns false for success results', () => {
      expect(isErr(ok(1))).toBe(false);
    });

    it('narrows the type so error is accessible', () => {
      const result: Result<number, string> = err('failure');
      if (isErr(result)) {
        const error: string = result.error;
        expect(error).toBe('failure');
      } else {
        expect.unreachable('Expected err result');
      }
    });
  });

  describe('mapResult()', () => {
    it('transforms the value when result is ok', () => {
      const result = ok(5);
      const mapped = mapResult(result, (v) => v * 2);
      expect(mapped).toEqual({ ok: true, value: 10 });
    });

    it('passes through the error when result is err', () => {
      const error = new Error('oops');
      const result = err(error);
      const mapped = mapResult(result, (_v: never) => 'should not run');
      expect(mapped).toEqual({ ok: false, error });
    });

    it('can chain multiple transformations', () => {
      const result = ok(3);
      const mapped = mapResult(
        mapResult(result, (v) => v + 1),
        (v) => `value: ${v}`,
      );
      expect(unwrap(mapped)).toBe('value: 4');
    });
  });

  describe('type narrowing with if checks', () => {
    it('narrows correctly when checking ok property directly', () => {
      const result: Result<string, Error> = ok('test');
      if (result.ok) {
        const value: string = result.value;
        expect(value).toBe('test');
      } else {
        expect.unreachable('Expected ok result');
      }
    });

    it('narrows to error branch when ok is false', () => {
      const result: Result<string, Error> = err(new Error('test error'));
      if (!result.ok) {
        const error: Error = result.error;
        expect(error.message).toBe('test error');
      } else {
        expect.unreachable('Expected err result');
      }
    });
  });
});
