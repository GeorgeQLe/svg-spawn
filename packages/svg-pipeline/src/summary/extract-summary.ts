import type {
  SvgDocument,
  SvgElement,
  SvgStructuredSummary,
  SvgFeatures,
  SvgSummaryElement,
} from '@svg-spawn/core';

/**
 * Walk the tree to build the element inventory, features, and elements list.
 */
function walkTree(
  element: SvgElement,
  path: string[],
  inventory: Record<string, number>,
  features: SvgFeatures,
  elements: SvgSummaryElement[],
  depthRef: { max: number },
  currentDepth: number,
): void {
  // Track max depth
  if (currentDepth > depthRef.max) {
    depthRef.max = currentDepth;
  }

  // Update inventory
  inventory[element.tagName] = (inventory[element.tagName] ?? 0) + 1;

  // Detect features
  switch (element.tagName) {
    case 'linearGradient':
    case 'radialGradient':
      features.hasGradients = true;
      break;
    case 'filter':
      features.hasFilters = true;
      break;
    case 'clipPath':
      features.hasClipPaths = true;
      break;
    case 'mask':
      features.hasMasks = true;
      break;
    case 'pattern':
      features.hasPatterns = true;
      break;
    case 'text':
    case 'tspan':
    case 'textPath':
      features.hasText = true;
      break;
  }

  // Build summary element
  const summaryEl: SvgSummaryElement = {
    nodeUid: element.nodeUid,
    tagName: element.tagName,
    path: [...path],
    ...(element.attributes.fill ? { fill: element.attributes.fill } : {}),
    ...(element.attributes.stroke ? { stroke: element.attributes.stroke } : {}),
  };
  elements.push(summaryEl);

  // Recurse into children
  const childPath = [...path, element.tagName];
  for (const child of element.children) {
    walkTree(child, childPath, inventory, features, elements, depthRef, currentDepth + 1);
  }
}

/**
 * Count total elements in the tree (including root).
 */
function countElements(element: SvgElement): number {
  let count = 1;
  for (const child of element.children) {
    count += countElements(child);
  }
  return count;
}

/**
 * Extract a structured summary from a processed SvgDocument.
 */
export function extractSummary(document: SvgDocument): SvgStructuredSummary {
  const { root, viewBox } = document;

  const inventory: Record<string, number> = {};
  const features: SvgFeatures = {
    hasGradients: false,
    hasFilters: false,
    hasClipPaths: false,
    hasMasks: false,
    hasPatterns: false,
    hasText: false,
  };
  const elements: SvgSummaryElement[] = [];
  const depthRef = { max: 0 };

  walkTree(root, [], inventory, features, elements, depthRef, 0);

  const viewBoxStr = `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`;

  return {
    viewBox: viewBoxStr,
    dimensions: {
      ...(document.width !== undefined ? { width: document.width } : {}),
      ...(document.height !== undefined ? { height: document.height } : {}),
    },
    elementInventory: inventory,
    totalElements: countElements(root),
    maxDepth: depthRef.max,
    features,
    elements,
  };
}
