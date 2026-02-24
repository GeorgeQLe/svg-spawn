import type { AnimationPlan, SvgDocument, Result } from '@svg-spawn/core';
import { ok, err } from '@svg-spawn/core';
import { CompilationError } from './errors.js';
import { validatePlan } from './validation/validate-plan.js';
import { validateOutput } from './validation/validate-output.js';
import { expandGroups, type ResolvedChannel } from './group-compiler/expand-groups.js';
import { assignBackends, type BackendAssignment } from './backend/select-backend.js';
import { generateSmil } from './generators/smil.js';
import { generateCss } from './generators/css.js';
import { assemble } from './assembler.js';

/**
 * Compile an AnimationPlan + SvgDocument into an animated SVG string.
 *
 * Pipeline:
 * 1. Validate plan
 * 2. Expand groups → resolved channels
 * 3. Merge explicit channels
 * 4. Select backends
 * 5. Generate SMIL + CSS
 * 6. Assemble
 * 7. Validate output
 */
export function compile(
  plan: AnimationPlan,
  document: SvgDocument,
): Result<string, CompilationError> {
  // 1. Validate plan
  const validationResult = validatePlan(plan, document);
  if (!validationResult.ok) {
    return err(validationResult.error);
  }

  // 2. Expand groups
  const expandResult = expandGroups(plan.groups, document);
  if (!expandResult.ok) {
    return err(expandResult.error);
  }

  let allChannels: ResolvedChannel[] = expandResult.value;

  // 3. Merge explicit channels from plan.channels
  for (const [nodeUid, channels] of Object.entries(plan.channels)) {
    for (const channel of channels) {
      allChannels.push({ nodeUid, channel });
    }
  }

  // 4. Select backends
  const backendResult = assignBackends(allChannels);
  if (!backendResult.ok) {
    return err(backendResult.error);
  }

  const assignments: BackendAssignment[] = backendResult.value;

  // 5. Generate SMIL and CSS
  const smilElements = generateSmil(assignments);
  const cssBlock = generateCss(assignments);

  // 6. Assemble
  const svgString = assemble(document, smilElements, cssBlock);

  // 7. Validate output
  const outputValidation = validateOutput(svgString);
  if (!outputValidation.ok) {
    return err(outputValidation.error);
  }

  return ok(svgString);
}
