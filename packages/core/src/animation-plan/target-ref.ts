import { z } from 'zod';

// ── TargetRef ────────────────────────────────────────────────────────────────

const ElementTargetRefSchema = z.object({
  type: z.literal('element'),
  nodeUid: z.string(),
});

const NamedSetTargetRefSchema = z.object({
  type: z.literal('named-set'),
  name: z.string(),
});

export const TargetRefSchema = z.discriminatedUnion('type', [
  ElementTargetRefSchema,
  NamedSetTargetRefSchema,
]);

export type TargetRef = z.infer<typeof TargetRefSchema>;
