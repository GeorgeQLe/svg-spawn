import type { SvgElement } from '@svg-spawn/core';

/**
 * Escape special XML characters in attribute values.
 */
function escapeAttrValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escape special XML characters in text content.
 */
function escapeTextContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Void elements that should self-close in SVG.
 */
const SELF_CLOSING_ELEMENTS = new Set([
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'stop',
  'use',
  'image',
  'animate',
  'animateTransform',
  'animateMotion',
  'set',
]);

/**
 * Serialize an SvgElement tree back to an SVG string.
 */
export function serializeSvg(element: SvgElement, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  const attrs = Object.entries(element.attributes)
    .map(([key, value]) => ` ${key}="${escapeAttrValue(value)}"`)
    .join('');

  const hasChildren = element.children.length > 0;
  const hasText = element.textContent !== undefined && element.textContent !== '';

  if (!hasChildren && !hasText && SELF_CLOSING_ELEMENTS.has(element.tagName)) {
    return `${pad}<${element.tagName}${attrs}/>`;
  }

  let result = `${pad}<${element.tagName}${attrs}>`;

  if (hasText && !hasChildren) {
    result += escapeTextContent(element.textContent!);
    result += `</${element.tagName}>`;
    return result;
  }

  if (hasChildren) {
    result += '\n';
    for (const child of element.children) {
      result += serializeSvg(child, indent + 1) + '\n';
    }
    if (hasText) {
      result += `${pad}  ${escapeTextContent(element.textContent!)}\n`;
    }
    result += `${pad}</${element.tagName}>`;
  } else {
    result += `</${element.tagName}>`;
  }

  return result;
}
