import type { SvgStructuredSummary, AnimationPlan } from '@svg-spawn/core';

/**
 * Builds a prompt for refining an existing animation plan.
 * Includes the prior plan as context along with the user's refinement instruction.
 */
export function buildChainingPrompt(
  summary: SvgStructuredSummary,
  priorPlan: AnimationPlan,
  refinementPrompt: string,
): string {
  const parts: string[] = [];

  parts.push('## SVG Document Summary\n');
  parts.push(JSON.stringify(summary, null, 2));

  parts.push('\n\n## Current Animation Plan\n');
  parts.push('The following AnimationPlan is currently applied to this SVG:\n');
  parts.push(JSON.stringify(priorPlan, null, 2));

  parts.push('\n\n## Refinement Instruction\n');
  parts.push(refinementPrompt);

  parts.push('\n\nGenerate an updated AnimationPlan JSON that applies the refinement above to the existing plan. Return the complete updated plan, not just the changes.');

  return parts.join('\n');
}
