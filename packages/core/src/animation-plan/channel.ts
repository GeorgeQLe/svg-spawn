import { z } from 'zod';
import { FillModeSchema, CompilationBackendSchema } from './constants.js';

// ── Keyframe ─────────────────────────────────────────────────────────────────

export const KeyframeSchema = z.object({
  offset: z.number().min(0).max(1),
  value: z.union([z.string(), z.number()]),
  easing: z.string().optional(),
});

export type Keyframe = z.infer<typeof KeyframeSchema>;

// ── RepeatCount ──────────────────────────────────────────────────────────────

const RepeatCountSchema = z.union([
  z.number().int().min(1),
  z.literal('indefinite'),
]);

// ── AnimationChannel ─────────────────────────────────────────────────────────

export const AnimationChannelSchema = z
  .object({
    property: z.string(),
    keyframes: z.array(KeyframeSchema).min(2),
    duration: z.number().gt(0),
    delay: z.number().min(0),
    repeatCount: RepeatCountSchema,
    fill: FillModeSchema,
    compilationBackend: CompilationBackendSchema,
  })
  .refine(
    (data) => {
      const offsets = data.keyframes.map((kf) => kf.offset);
      for (let i = 1; i < offsets.length; i++) {
        if (offsets[i]! <= offsets[i - 1]!) {
          return false;
        }
      }
      return true;
    },
    { message: 'Keyframe offsets must be in strictly ascending order' },
  );

export type AnimationChannel = z.infer<typeof AnimationChannelSchema>;
