import { z } from 'zod';

export const JobSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  result: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Job = z.infer<typeof JobSchema>;
