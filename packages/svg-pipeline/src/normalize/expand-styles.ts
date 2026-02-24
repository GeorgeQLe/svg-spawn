import type { SvgElement } from '@svg-spawn/core';

/**
 * Expand inline styles into presentation attributes.
 *
 * TODO: Implement CSS parsing and inline expansion for <style> blocks.
 * For now, this is a passthrough that returns the tree unchanged.
 */
export function expandStyles(root: SvgElement): SvgElement {
  // Passthrough: return the tree as-is
  return root;
}
