import { z } from 'zod';
import { EffectTypeSchema, EasingPresetSchema } from './constants.js';
import { TargetRefSchema } from './target-ref.js';

// ── RepeatCount ──────────────────────────────────────────────────────────────

const RepeatCountSchema = z.union([
  z.number().int().min(1),
  z.literal('indefinite'),
]);

// ── AnimationGroup ───────────────────────────────────────────────────────────

export const AnimationGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  effectType: EffectTypeSchema,
  targets: z.array(TargetRefSchema).nonempty(),
  startTime: z.number().min(0),
  duration: z.number().gt(0),
  easingPreset: EasingPresetSchema,
  repeatCount: RepeatCountSchema,
});

export type AnimationGroup = z.infer<typeof AnimationGroupSchema>;
