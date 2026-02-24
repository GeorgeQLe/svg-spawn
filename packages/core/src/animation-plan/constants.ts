import { z } from 'zod';

// ── Effect Type ──────────────────────────────────────────────────────────────

export const EffectTypeSchema = z.enum([
  'bounce',
  'fade',
  'slide',
  'rotate',
  'scale',
  'draw-on',
  'pulse',
  'shake',
  'float',
  'color-cycle',
]);

export type EffectType = z.infer<typeof EffectTypeSchema>;

// ── Easing Preset ────────────────────────────────────────────────────────────

export const EasingPresetSchema = z.enum([
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'spring',
  'bounce',
]);

export type EasingPreset = z.infer<typeof EasingPresetSchema>;

// ── Fill Mode ────────────────────────────────────────────────────────────────

export const FillModeSchema = z.enum([
  'forwards',
  'backwards',
  'both',
  'none',
  'freeze',
  'remove',
]);

export type FillMode = z.infer<typeof FillModeSchema>;

// ── Compilation Backend ──────────────────────────────────────────────────────

export const CompilationBackendSchema = z.enum(['smil', 'css', 'auto']);

export type CompilationBackend = z.infer<typeof CompilationBackendSchema>;
