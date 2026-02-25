import type { Session } from '@/lib/auth';
import type { PipelineResult } from '@svg-spawn/svg-pipeline';
import type { SvgDocument, SvgStructuredSummary } from '@svg-spawn/core';

export const DEV_SESSION: Session = {
  user: {
    id: 'dev-user',
    name: 'Dev User',
    email: 'dev@localhost',
  },
};

export function makeSvgDocument(): SvgDocument {
  return {
    root: {
      nodeUid: 'root-1',
      tagName: 'svg',
      attributes: { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 100 100' },
      children: [
        {
          nodeUid: 'circle-1',
          tagName: 'circle',
          attributes: { cx: '50', cy: '50', r: '40' },
          children: [],
        },
      ],
    },
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    namespaces: { xmlns: 'http://www.w3.org/2000/svg' },
  };
}

export function makeSummary(): SvgStructuredSummary {
  return {
    viewBox: '0 0 100 100',
    dimensions: { width: 100, height: 100 },
    elementInventory: { circle: 1 },
    totalElements: 2,
    maxDepth: 1,
    features: {
      hasGradients: false,
      hasFilters: false,
      hasClipPaths: false,
      hasMasks: false,
      hasPatterns: false,
      hasText: false,
    },
    elements: [
      {
        nodeUid: 'circle-1',
        tagName: 'circle',
        path: ['svg', 'circle'],
        fill: undefined,
        stroke: undefined,
      },
    ],
  };
}

export function makePipelineResult(): PipelineResult {
  return {
    document: makeSvgDocument(),
    summary: makeSummary(),
    complexity: {
      totalScore: 10,
      elementCount: 2,
      pathCount: 0,
      totalPathLength: 0,
      maxNestingDepth: 1,
      filterCount: 0,
      gradientCount: 0,
      clipPathCount: 0,
    },
    hadAnimations: false,
  };
}

export const VALID_SVG = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>';
