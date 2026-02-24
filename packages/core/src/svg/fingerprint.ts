import { z } from 'zod';

export const BBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const CentroidSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const ElementFingerprintSchema = z.object({
  tagName: z.string(),
  ancestryPath: z.array(z.string()),
  bbox: BBoxSchema.optional(),
  centroid: CentroidSchema.optional(),
  area: z.number().optional(),
  pathLength: z.number().optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export type BBox = z.infer<typeof BBoxSchema>;
export type Centroid = z.infer<typeof CentroidSchema>;
export type ElementFingerprint = z.infer<typeof ElementFingerprintSchema>;
