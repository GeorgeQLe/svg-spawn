import type { AnimationPlan, SvgDocument, SvgElement, Result } from '@svg-spawn/core';
import { ok, err } from '@svg-spawn/core';
import { ValidationError } from '../errors.js';
import { isKnownEffect } from '../group-compiler/effect-library.js';

/**
 * Collect all nodeUids from the document tree.
 */
function collectNodeUids(element: SvgElement): Set<string> {
  const uids = new Set<string>();
  uids.add(element.nodeUid);
  for (const child of element.children) {
    for (const uid of collectNodeUids(child)) {
      uids.add(uid);
    }
  }
  return uids;
}

/**
 * Pre-compilation validation of an AnimationPlan against an SvgDocument.
 */
export function validatePlan(
  plan: AnimationPlan,
  document: SvgDocument,
): Result<void, ValidationError> {
  const errors: string[] = [];
  const allUids = collectNodeUids(document.root);

  // Validate groups
  for (const group of plan.groups) {
    // Check effect type
    if (!isKnownEffect(group.effectType)) {
      errors.push(`Unknown effect type "${group.effectType}" in group "${group.id}"`);
    }

    // Check duration
    if (group.duration <= 0) {
      errors.push(`Group "${group.id}" has non-positive duration: ${group.duration}`);
    }

    // Check targets exist
    for (const target of group.targets) {
      if (target.type === 'element') {
        if (!allUids.has(target.nodeUid)) {
          errors.push(
            `Group "${group.id}" references nonexistent target nodeUid "${target.nodeUid}"`,
          );
        }
      }
    }
  }

  // Check for duplicate property drivers from explicit channels
  const channelOwners = new Map<string, string>();
  for (const [nodeUid, channels] of Object.entries(plan.channels)) {
    if (!allUids.has(nodeUid)) {
      errors.push(`Channel references nonexistent nodeUid "${nodeUid}"`);
    }

    for (const channel of channels) {
      const key = `${nodeUid}:${channel.property}`;
      if (channelOwners.has(key)) {
        errors.push(
          `Duplicate property driver: "${channel.property}" on element "${nodeUid}" is animated by multiple channels`,
        );
      } else {
        channelOwners.set(key, nodeUid);
      }

      if (channel.duration <= 0) {
        errors.push(`Channel for "${channel.property}" on "${nodeUid}" has non-positive duration`);
      }
    }
  }

  if (errors.length > 0) {
    return err(new ValidationError('Plan validation failed', errors));
  }

  return ok(undefined);
}
