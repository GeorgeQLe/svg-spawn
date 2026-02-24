import type { SvgElement, ComplexityScore } from '@svg-spawn/core';

/**
 * Count the number of path data commands in a path 'd' attribute.
 * Commands are single letters (M, L, C, S, Q, T, A, Z, H, V, and lowercase).
 */
function countPathCommands(d: string): number {
  const matches = d.match(/[MmLlCcSsQqTtAaZzHhVv]/g);
  return matches ? matches.length : 0;
}

/**
 * Internal mutable accumulator for tree traversal.
 */
interface ScoreAccumulator {
  elementCount: number;
  pathCount: number;
  totalPathLength: number;
  maxNestingDepth: number;
  filterCount: number;
  gradientCount: number;
  clipPathCount: number;
}

/**
 * Walk the tree and accumulate counts.
 */
function accumulateScores(
  element: SvgElement,
  depth: number,
  acc: ScoreAccumulator,
): void {
  acc.elementCount++;

  if (depth > acc.maxNestingDepth) {
    acc.maxNestingDepth = depth;
  }

  switch (element.tagName) {
    case 'path':
      acc.pathCount++;
      if (element.attributes.d) {
        acc.totalPathLength += countPathCommands(element.attributes.d);
      }
      break;
    case 'filter':
      acc.filterCount++;
      break;
    case 'linearGradient':
    case 'radialGradient':
      acc.gradientCount++;
      break;
    case 'clipPath':
      acc.clipPathCount++;
      break;
  }

  for (const child of element.children) {
    accumulateScores(child, depth + 1, acc);
  }
}

/**
 * Compute a ComplexityScore from an SvgElement tree.
 *
 * Formula: elementCount * 1 + pathCount * 3 + totalPathLength * 0.1
 *        + filterCount * 20 + gradientCount * 5 + clipPathCount * 10
 *        + maxNestingDepth * 2
 */
export function computeComplexityScore(root: SvgElement): ComplexityScore {
  const acc: ScoreAccumulator = {
    elementCount: 0,
    pathCount: 0,
    totalPathLength: 0,
    maxNestingDepth: 0,
    filterCount: 0,
    gradientCount: 0,
    clipPathCount: 0,
  };

  accumulateScores(root, 0, acc);

  const totalScore =
    acc.elementCount * 1 +
    acc.pathCount * 3 +
    acc.totalPathLength * 0.1 +
    acc.filterCount * 20 +
    acc.gradientCount * 5 +
    acc.clipPathCount * 10 +
    acc.maxNestingDepth * 2;

  return {
    totalScore,
    elementCount: acc.elementCount,
    pathCount: acc.pathCount,
    totalPathLength: acc.totalPathLength,
    maxNestingDepth: acc.maxNestingDepth,
    filterCount: acc.filterCount,
    gradientCount: acc.gradientCount,
    clipPathCount: acc.clipPathCount,
  };
}
