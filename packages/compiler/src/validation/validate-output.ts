import type { Result } from '@svg-spawn/core';
import { ok, err } from '@svg-spawn/core';
import { ValidationError } from '../errors.js';

/**
 * Basic well-formed XML check.
 * We verify the output starts with XML declaration and contains an <svg> element,
 * and do basic tag matching.
 */
export function validateOutput(svgString: string): Result<void, ValidationError> {
  const errors: string[] = [];

  // Check it contains an SVG element
  if (!svgString.includes('<svg')) {
    errors.push('Output does not contain an <svg> element');
  }

  // Check for XML declaration
  if (!svgString.startsWith('<?xml')) {
    errors.push('Output does not start with XML declaration');
  }

  // Basic well-formedness: check that open tags are closed
  // This is a simplified check - not a full XML parser
  const selfClosingRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*\/>/g;

  const selfClosing = new Set<string>();
  let match: RegExpExecArray | null;

  // Collect self-closing tags (they don't need closing tags)
  while ((match = selfClosingRegex.exec(svgString)) !== null) {
    selfClosing.add(match[1]!);
  }

  // Count open and close tags (excluding self-closing, XML decl, and special tags)
  const tagStack: string[] = [];
  // Use a combined regex to match tags in order
  const allTagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/g;

  while ((match = allTagRegex.exec(svgString)) !== null) {
    const fullMatch = match[0]!;
    const tagName = match[1]!;

    // Skip XML declaration
    if (fullMatch.startsWith('<?')) continue;
    // Skip self-closing
    if (fullMatch.endsWith('/>')) continue;
    // Skip closing tags
    if (fullMatch.startsWith('</')) {
      if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
        tagStack.pop();
      }
      continue;
    }
    // Opening tag
    tagStack.push(tagName);
  }

  if (tagStack.length > 0) {
    errors.push(`Unclosed tags detected: ${tagStack.join(', ')}`);
  }

  if (errors.length > 0) {
    return err(new ValidationError('Output validation failed', errors));
  }

  return ok(undefined);
}
