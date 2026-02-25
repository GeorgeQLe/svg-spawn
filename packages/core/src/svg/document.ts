import { z } from 'zod';
import { SvgElementSchema } from './element.js';

export const ViewBoxSchema = z.object({
  minX: z.number(),
  minY: z.number(),
  width: z.number(),
  height: z.number(),
});

export const SvgDocumentSchema = z.object({
  root: SvgElementSchema,
  viewBox: ViewBoxSchema,
  width: z.number().optional(),
  height: z.number().optional(),
  namespaces: z.record(z.string(), z.string()),
});

export type ViewBox = z.infer<typeof ViewBoxSchema>;
export type SvgDocument = z.infer<typeof SvgDocumentSchema>;
