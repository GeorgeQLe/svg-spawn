import type { SvgStructuredSummary } from '@svg-spawn/core';

/**
 * Builds the user prompt for initial animation plan generation.
 * Combines the SVG summary, user instruction, and optionally the raw SVG.
 */
export function buildGenerationPrompt(
  summary: SvgStructuredSummary,
  userPrompt: string,
  rawSvg?: string,
): string {
  const parts: string[] = [];

  parts.push('## SVG Document Summary\n');
  parts.push(JSON.stringify(summary, null, 2));

  parts.push('\n\n## User Animation Instruction\n');
  parts.push(userPrompt);

  if (rawSvg) {
    parts.push('\n\n## Raw SVG Source\n');
    parts.push('```xml');
    parts.push(rawSvg);
    parts.push('```');
  }

  parts.push('\n\nGenerate an AnimationPlan JSON for this SVG based on the instruction above.');

  return parts.join('\n');
}
