import {
  type Result,
  type AnimationPlan,
  AnimationPlanSchema,
  ok,
  err,
  validateWithSchema,
  formatZodError,
} from '@svg-spawn/core';
import { AiError } from '../errors.js';

/**
 * Validates parsed JSON against the AnimationPlan schema and cross-references
 * target nodeUids against the valid node UIDs from the SVG document.
 */
export function validateAiResponse(
  parsed: unknown,
  validNodeUids: string[],
): Result<AnimationPlan, AiError> {
  // First validate against the Zod schema
  const schemaResult = validateWithSchema(AnimationPlanSchema, parsed);

  if (!schemaResult.ok) {
    const errorMessage = formatZodError(schemaResult.error);
    return err(new AiError(`Schema validation failed:\n${errorMessage}`, 'validation'));
  }

  const plan = schemaResult.value;

  // Cross-reference target nodeUids against valid UIDs
  const validUidSet = new Set(validNodeUids);
  const invalidUids: string[] = [];

  for (const group of plan.groups) {
    for (const target of group.targets) {
      if (target.type === 'element' && !validUidSet.has(target.nodeUid)) {
        invalidUids.push(target.nodeUid);
      }
    }
  }

  if (invalidUids.length > 0) {
    return err(
      new AiError(
        `Invalid target nodeUids: ${invalidUids.join(', ')}. These elements do not exist in the SVG document.`,
        'validation',
      ),
    );
  }

  return ok(plan);
}
