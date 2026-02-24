import { z } from 'zod';

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  createdAt: z.string().datetime(),
  plan: z.enum(['free', 'pro']),
  creditsRemaining: z.number().int().min(0),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
