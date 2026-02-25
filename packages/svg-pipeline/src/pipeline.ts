import type {
  SvgDocument,
  SvgStructuredSummary,
  ComplexityScore,
} from '@svg-spawn/core';
import { type Result, ok, COMPLEXITY_THRESHOLDS } from '@svg-spawn/core';
import { type ParseError, type SanitizationError, type ComplexityExceeded } from './errors.js';
import { parseSvg } from './parser/parse-svg.js';
import { sanitize } from './sanitize/sanitize.js';
import { normalize } from './normalize/normalize.js';
import { detectAndStripAnimations } from './detect-animations.js';
import { computeComplexityScore } from './complexity/score.js';
import { gateComplexity } from './complexity/gate.js';
import { extractSummary } from './summary/extract-summary.js';

/**
 * Options for the SVG processing pipeline.
 */
export interface PipelineOptions {
  /** Maximum complexity score allowed. Defaults to COMPLEXITY_THRESHOLDS.max (5000). */
  maxComplexity?: number;
}

/**
 * Successful result from the SVG processing pipeline.
 */
export interface PipelineResult {
  document: SvgDocument;
  summary: SvgStructuredSummary;
  complexity: ComplexityScore;
  hadAnimations: boolean;
}

/**
 * Union of all possible pipeline errors.
 */
export type PipelineError = ParseError | SanitizationError | ComplexityExceeded;

/**
 * Parse a viewBox string like "0 0 100 100" into its components.
 */
function parseViewBox(viewBoxStr: string | undefined): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  if (!viewBoxStr) {
    return { minX: 0, minY: 0, width: 300, height: 150 }; // SVG default
  }
  const parts = viewBoxStr.trim().split(/[\s,]+/).map(Number);
  return {
    minX: parts[0] ?? 0,
    minY: parts[1] ?? 0,
    width: parts[2] ?? 300,
    height: parts[3] ?? 150,
  };
}

/**
 * Process an SVG string through the full pipeline:
 * parse -> sanitize -> normalize -> detect animations -> score complexity -> gate -> extract summary
 */
export function processSvg(
  svgString: string,
  options: PipelineOptions = {},
): Result<PipelineResult, PipelineError> {
  const maxComplexity = options.maxComplexity ?? COMPLEXITY_THRESHOLDS.max;

  // 1. Parse
  const parseResult = parseSvg(svgString);
  if (!parseResult.ok) {
    return parseResult;
  }
  let tree = parseResult.value;

  // 2. Sanitize
  const sanitizeResult = sanitize(tree);
  if (!sanitizeResult.ok) {
    return sanitizeResult;
  }
  tree = sanitizeResult.value;

  // 3. Normalize (assign UIDs, compute fingerprints, expand styles)
  tree = normalize(tree);

  // 4. Detect and strip animations
  const { tree: strippedTree, hadAnimations } = detectAndStripAnimations(tree);
  tree = strippedTree;

  // 5. Build SvgDocument
  const viewBox = parseViewBox(tree.attributes.viewBox ?? tree.attributes.viewbox);
  const widthStr = tree.attributes.width;
  const heightStr = tree.attributes.height;

  const document: SvgDocument = {
    root: tree,
    viewBox,
    ...(widthStr ? { width: parseFloat(widthStr) } : {}),
    ...(heightStr ? { height: parseFloat(heightStr) } : {}),
    namespaces: extractNamespaces(tree.attributes),
  };

  // 6. Compute complexity
  const complexity = computeComplexityScore(tree);

  // 7. Gate complexity
  const gateResult = gateComplexity(complexity, maxComplexity);
  if (!gateResult.ok) {
    return gateResult;
  }

  // 8. Extract summary
  const summary = extractSummary(document);

  return ok({
    document,
    summary,
    complexity,
    hadAnimations,
  });
}

/**
 * Extract namespace declarations from the root svg element attributes.
 */
function extractNamespaces(attributes: Record<string, string>): Record<string, string> {
  const namespaces: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'xmlns' || key.startsWith('xmlns:')) {
      namespaces[key] = value;
    }
  }
  return namespaces;
}
