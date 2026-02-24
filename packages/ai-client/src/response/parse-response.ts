import { type Result, ok, err } from '@svg-spawn/core';
import { AiError } from '../errors.js';

/**
 * Extracts and parses JSON from an AI response text.
 *
 * Handles multiple formats:
 * - Raw JSON responses
 * - Markdown-wrapped JSON (```json ... ```)
 * - Responses with text before/after JSON
 */
export function parseAiResponse(responseText: string): Result<unknown, AiError> {
  const trimmed = responseText.trim();

  // Try parsing the entire response as JSON first
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return ok(parsed);
  } catch {
    // Not raw JSON, try other formats
  }

  // Try extracting from markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/;
  const codeBlockMatch = codeBlockRegex.exec(trimmed);
  if (codeBlockMatch?.[1]) {
    try {
      const parsed: unknown = JSON.parse(codeBlockMatch[1].trim());
      return ok(parsed);
    } catch {
      return err(new AiError('Found JSON code block but it contains invalid JSON syntax', 'parse'));
    }
  }

  // Try to find a JSON object in the text (first { to last })
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      const parsed: unknown = JSON.parse(jsonCandidate);
      return ok(parsed);
    } catch {
      return err(new AiError('Found JSON-like content but it contains invalid JSON syntax', 'parse'));
    }
  }

  return err(new AiError('No JSON found in AI response', 'parse'));
}
