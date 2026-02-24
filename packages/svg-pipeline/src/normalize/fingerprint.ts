import type { SvgElement, ElementFingerprint } from '@svg-spawn/core';

/**
 * Compute an ElementFingerprint for each element in the tree.
 * Captures tagName, ancestry path, and visual attributes (fill, stroke, opacity).
 */
export function computeFingerprints(root: SvgElement): SvgElement {
  return computeFingerprintRecursive(root, []);
}

function computeFingerprintRecursive(
  element: SvgElement,
  ancestryPath: string[],
): SvgElement {
  const fingerprint: ElementFingerprint = {
    tagName: element.tagName,
    ancestryPath: [...ancestryPath],
    ...(element.attributes.fill ? { fill: element.attributes.fill } : {}),
    ...(element.attributes.stroke ? { stroke: element.attributes.stroke } : {}),
    ...(element.attributes.opacity
      ? { opacity: parseFloat(element.attributes.opacity) }
      : {}),
  };

  const newAncestry = [...ancestryPath, element.tagName];
  const children = element.children.map((child) =>
    computeFingerprintRecursive(child, newAncestry),
  );

  return {
    ...element,
    fingerprint,
    children,
  };
}
