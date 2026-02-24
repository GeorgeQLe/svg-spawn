import type { SvgElement } from '@svg-spawn/core';
import { assignUids } from './assign-uids.js';
import { computeFingerprints } from './fingerprint.js';
import { expandStyles } from './expand-styles.js';

/**
 * Normalize an SvgElement tree:
 * 1. Assign unique UIDs to all elements
 * 2. Compute fingerprints for each element
 * 3. Expand inline styles (passthrough for now)
 */
export function normalize(root: SvgElement): SvgElement {
  let tree = assignUids(root);
  tree = computeFingerprints(tree);
  tree = expandStyles(tree);
  return tree;
}
