import { z } from 'zod';

export const GenerationEdgeSchema = z.object({
  id: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  type: z.enum(['branch', 'refine', 'chain']),
});

export type GenerationEdge = z.infer<typeof GenerationEdgeSchema>;
