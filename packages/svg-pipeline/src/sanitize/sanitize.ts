import type { SvgElement } from '@svg-spawn/core';
import { type Result, ok, err } from '@svg-spawn/core';
import { SanitizationError } from '../errors.js';
import { ALLOWED_ELEMENTS, FORBIDDEN_ELEMENTS, isAllowedAttribute } from './allowlist.js';

/**
 * Patterns for detecting dangerous URI schemes.
 */
const JAVASCRIPT_URI_RE = /^\s*javascript\s*:/i;
const DATA_TEXT_HTML_RE = /^\s*data\s*:\s*text\/html/i;
const ALLOWED_DATA_URI_RE = /^\s*data\s*:\s*image\/(png|jpeg|gif|svg\+xml|webp)/i;

/**
 * Check if an href/xlink:href value is safe.
 */
function isSafeHref(value: string): boolean {
  const trimmed = value.trim();

  // Internal references are always safe
  if (trimmed.startsWith('#')) {
    return true;
  }

  // Reject javascript: URIs
  if (JAVASCRIPT_URI_RE.test(trimmed)) {
    return false;
  }

  // For data: URIs, only allow image types
  if (trimmed.startsWith('data:')) {
    if (DATA_TEXT_HTML_RE.test(trimmed)) {
      return false;
    }
    if (ALLOWED_DATA_URI_RE.test(trimmed)) {
      return true;
    }
    // Reject other data: URI types
    return false;
  }

  // Allow regular URLs (http, https, relative)
  return true;
}

/**
 * Sanitize a single element's attributes, removing disallowed ones.
 * Returns a list of violation descriptions.
 */
function sanitizeAttributes(
  element: SvgElement,
  violations: string[],
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(element.attributes)) {
    // Strip event handlers (on*)
    if (key.startsWith('on')) {
      violations.push(`Stripped event handler attribute "${key}" from <${element.tagName}>`);
      continue;
    }

    // Check href/xlink:href for dangerous values
    if (key === 'href' || key === 'xlink:href') {
      if (!isSafeHref(value)) {
        violations.push(
          `Stripped unsafe href value "${value}" from <${element.tagName}>`,
        );
        continue;
      }
    }

    // Check style attribute for javascript:
    if (key === 'style' && JAVASCRIPT_URI_RE.test(value)) {
      violations.push(
        `Stripped style with javascript: URI from <${element.tagName}>`,
      );
      continue;
    }

    // Check if attribute is in the allowlist
    if (!isAllowedAttribute(key)) {
      // Silently skip non-allowed attributes (don't log as violation)
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Recursively sanitize an SvgElement tree.
 * Removes forbidden elements, strips dangerous attributes and URIs.
 */
function sanitizeElement(
  element: SvgElement,
  violations: string[],
): SvgElement {
  // Sanitize attributes
  const attributes = sanitizeAttributes(element, violations);

  // Recursively process children, filtering out forbidden elements
  const children: SvgElement[] = [];
  for (const child of element.children) {
    if (FORBIDDEN_ELEMENTS.has(child.tagName)) {
      violations.push(`Stripped forbidden element <${child.tagName}>`);
      continue;
    }

    if (!ALLOWED_ELEMENTS.has(child.tagName)) {
      violations.push(`Stripped unknown element <${child.tagName}>`);
      continue;
    }

    children.push(sanitizeElement(child, violations));
  }

  return {
    ...element,
    attributes,
    children,
  };
}

/**
 * Sanitize an SVG element tree.
 *
 * Removes:
 * - <script>, <foreignObject>, <iframe> elements
 * - on* event handler attributes
 * - javascript: URIs in href values
 * - data:text/html URIs (allows data:image/png and data:image/jpeg)
 * - Disallowed elements and attributes
 *
 * Returns Result<SvgElement, SanitizationError>.
 */
export function sanitize(root: SvgElement): Result<SvgElement, SanitizationError> {
  const violations: string[] = [];

  // The root itself should be <svg>, but check anyway
  if (FORBIDDEN_ELEMENTS.has(root.tagName)) {
    return err(new SanitizationError('Root element is forbidden', [root.tagName]));
  }

  const sanitized = sanitizeElement(root, violations);
  return ok(sanitized);
}
