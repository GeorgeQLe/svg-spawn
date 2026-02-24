import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  originalSvg: z.string(),
  processedSvgDocumentId: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
