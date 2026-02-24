import { z } from 'zod';
import { AnimationGroupSchema } from './group.js';
import { AnimationChannelSchema } from './channel.js';

// ── Metadata ─────────────────────────────────────────────────────────────────

const AnimationPlanMetadataSchema = z.object({
  generatedAt: z.string(),
  modelId: z.string(),
  userPrompt: z.string(),
});

// ── AnimationPlan ────────────────────────────────────────────────────────────

export const AnimationPlanSchema = z.object({
  id: z.string(),
  svgDocumentId: z.string(),
  groups: z.array(AnimationGroupSchema),
  channels: z.record(z.string(), z.array(AnimationChannelSchema)),
  metadata: AnimationPlanMetadataSchema,
});

export type AnimationPlan = z.infer<typeof AnimationPlanSchema>;
