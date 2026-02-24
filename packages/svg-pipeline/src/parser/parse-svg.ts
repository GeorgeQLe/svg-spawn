import { XMLParser } from 'fast-xml-parser';
import type { SvgElement } from '@svg-spawn/core';
import { type Result, ok, err } from '@svg-spawn/core';
import { ParseError } from '../errors.js';

/**
 * Options for fast-xml-parser that produce a tree we can walk.
 * - Preserve attributes with '@_' prefix
 * - Preserve text content
 * - Do NOT process DTDs or external entities
 * - Always produce arrays for children so traversal is consistent
 */
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  preserveOrder: true,
  trimValues: true,
  processEntities: false,
  // Disable DTD / external entity processing for security
  ignorePiTags: true,
};

/**
 * A node from fast-xml-parser in preserveOrder mode.
 * Uses Record to avoid index signature conflicts.
 */
type FxpNode = Record<string, FxpNode[] | Record<string, string> | string | undefined>;

/**
 * Convert a fast-xml-parser preserveOrder node into our SvgElement tree.
 */
function fxpNodeToSvgElement(node: FxpNode): SvgElement | null {
  // In preserveOrder mode, each node is { tagName: children[], ':@': { '@_attr': val } }
  const keys = Object.keys(node).filter((k) => k !== ':@');
  if (keys.length === 0) return null;

  const tagName = keys[0];

  // Skip processing instructions and text-only nodes
  if (tagName === '?xml' || tagName === '?xml-stylesheet') return null;

  const rawAttrs = (node[':@'] ?? {}) as Record<string, string>;
  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawAttrs)) {
    // Remove the '@_' prefix that fast-xml-parser adds
    const attrName = key.startsWith('@_') ? key.slice(2) : key;
    attributes[attrName] = String(value);
  }

  const children: SvgElement[] = [];
  let textContent: string | undefined;

  const childNodes = node[tagName];
  if (Array.isArray(childNodes)) {
    for (const child of childNodes as FxpNode[]) {
      // Text nodes appear as { '#text': 'content' }
      if ('#text' in child) {
        const txt = child['#text'];
        if (typeof txt === 'string' || typeof txt === 'number') {
          textContent = (textContent ?? '') + String(txt);
        }
        continue;
      }
      const childEl = fxpNodeToSvgElement(child);
      if (childEl) {
        children.push(childEl);
      }
    }
  }

  return {
    nodeUid: '', // Will be assigned in normalization
    tagName,
    attributes,
    children,
    ...(textContent !== undefined ? { textContent } : {}),
  };
}

/**
 * Parse an SVG string into an SvgElement tree.
 * Returns the root <svg> element.
 */
export function parseSvg(svgString: string): Result<SvgElement, ParseError> {
  try {
    const parser = new XMLParser(parserOptions);
    const parsed: FxpNode[] = parser.parse(svgString);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return err(new ParseError('No elements found in SVG'));
    }

    // Find the <svg> root element
    for (const node of parsed) {
      const el = fxpNodeToSvgElement(node);
      if (el && el.tagName === 'svg') {
        return ok(el);
      }
    }

    // If no explicit <svg> root, try converting the first element
    const first = fxpNodeToSvgElement(parsed[0]);
    if (first) {
      return ok(first);
    }

    return err(new ParseError('Could not find root SVG element'));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return err(new ParseError(`XML parse error: ${msg}`));
  }
}
