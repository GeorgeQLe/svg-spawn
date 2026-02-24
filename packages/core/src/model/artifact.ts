import { z } from 'zod';

export const ArtifactSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  type: z.enum(['animation-plan', 'animated-svg', 'original-svg', 'processed-svg']),
  content: z.string(),
  createdAt: z.string().datetime(),
});

export type Artifact = z.infer<typeof ArtifactSchema>;
