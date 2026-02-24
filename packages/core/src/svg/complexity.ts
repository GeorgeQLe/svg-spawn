import { z } from 'zod';

export const ComplexityScoreSchema = z.object({
  totalScore: z.number().min(0),
  elementCount: z.number().int().min(0),
  pathCount: z.number().int().min(0),
  totalPathLength: z.number().min(0),
  maxNestingDepth: z.number().int().min(0),
  filterCount: z.number().int().min(0),
  gradientCount: z.number().int().min(0),
  clipPathCount: z.number().int().min(0),
});

export type ComplexityScore = z.infer<typeof ComplexityScoreSchema>;

export const COMPLEXITY_THRESHOLDS = {
  low: 100,
  medium: 500,
  high: 1000,
  max: 5000,
} as const;
