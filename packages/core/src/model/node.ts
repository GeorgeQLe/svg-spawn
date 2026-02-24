import { z } from 'zod';

export const GenerationNodeSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  parentNodeId: z.string().optional(),
  prompt: z.string(),
  status: z.enum(['pending', 'generating', 'completed', 'failed']),
  animationPlanId: z.string().optional(),
  animatedSvg: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type GenerationNode = z.infer<typeof GenerationNodeSchema>;
