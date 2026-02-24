import { z } from 'zod';
import { type Result, ok, err } from './result.js';

/**
 * Validates unknown data against a Zod schema, returning a Result
 * instead of throwing.
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Result<T, z.ZodError> {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return ok(parsed.data);
  }
  return err(parsed.error);
}

/**
 * Formats a ZodError into a human-readable string.
 * Each issue is listed on its own line with its path and message.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    })
    .join('\n');
}
