import { z } from 'zod';

export const SvgFeaturesSchema = z.object({
  hasGradients: z.boolean(),
  hasFilters: z.boolean(),
  hasClipPaths: z.boolean(),
  hasMasks: z.boolean(),
  hasPatterns: z.boolean(),
  hasText: z.boolean(),
});

export const SvgSummaryElementSchema = z.object({
  nodeUid: z.string(),
  tagName: z.string(),
  path: z.array(z.string()),
  fill: z.string().optional(),
  stroke: z.string().optional(),
});

export const SvgStructuredSummarySchema = z.object({
  viewBox: z.string(),
  dimensions: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }),
  elementInventory: z.record(z.string(), z.number()),
  totalElements: z.number().int().min(0),
  maxDepth: z.number().int().min(0),
  features: SvgFeaturesSchema,
  elements: z.array(SvgSummaryElementSchema),
});

export type SvgFeatures = z.infer<typeof SvgFeaturesSchema>;
export type SvgSummaryElement = z.infer<typeof SvgSummaryElementSchema>;
export type SvgStructuredSummary = z.infer<typeof SvgStructuredSummarySchema>;
