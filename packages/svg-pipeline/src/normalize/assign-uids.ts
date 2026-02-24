import type { SvgElement } from '@svg-spawn/core';

/**
 * Walk the element tree and assign a unique nodeUid to each element.
 * Uses a deterministic scheme: full ancestry path + tagName + sibling index.
 * Example: "svg-0/g-0/rect-0", "svg-0/g-0/rect-1"
 */
export function assignUids(root: SvgElement): SvgElement {
  return assignUidsRecursive(root, '', new Map());
}

function assignUidsRecursive(
  element: SvgElement,
  parentPath: string,
  siblingCounters: Map<string, number>,
): SvgElement {
  // Determine this element's index among siblings with the same tag
  const countKey = `${parentPath}/${element.tagName}`;
  const index = siblingCounters.get(countKey) ?? 0;
  siblingCounters.set(countKey, index + 1);

  const segment = `${element.tagName}-${index}`;
  const uid = parentPath ? `${parentPath}/${segment}` : segment;

  // Process children with fresh sibling counters for this level
  const childCounters = new Map<string, number>();
  const children = element.children.map((child) =>
    assignUidsRecursive(child, uid, childCounters),
  );

  return {
    ...element,
    nodeUid: uid,
    children,
  };
}
