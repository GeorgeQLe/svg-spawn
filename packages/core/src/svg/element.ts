import { z } from 'zod';
import { ElementFingerprintSchema, type ElementFingerprint } from './fingerprint.js';

export const SvgElementSchema: z.ZodType<SvgElement> = z.lazy(() =>
  z.object({
    nodeUid: z.string().min(1),
    tagName: z.string().min(1),
    attributes: z.record(z.string(), z.string()),
    children: z.array(SvgElementSchema),
    fingerprint: ElementFingerprintSchema.optional(),
    textContent: z.string().optional(),
  }),
);

export type SvgElement = {
  nodeUid: string;
  tagName: string;
  attributes: Record<string, string>;
  children: SvgElement[];
  fingerprint?: ElementFingerprint;
  textContent?: string;
};
