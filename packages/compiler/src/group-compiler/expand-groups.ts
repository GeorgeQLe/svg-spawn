import type {
  AnimationGroup,
  AnimationChannel,
  SvgDocument,
  SvgElement,
  Result,
  FillMode,
} from '@svg-spawn/core';
import { ok, err } from '@svg-spawn/core';
import { getEffectChannels } from './effect-library.js';
import { CompilationError } from '../errors.js';

/**
 * A resolved channel bound to a specific element nodeUid.
 */
export interface ResolvedChannel {
  nodeUid: string;
  channel: AnimationChannel;
}

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
 * Resolve a TargetRef list to actual nodeUids within the document.
 */
function resolveTargets(
  group: AnimationGroup,
  document: SvgDocument,
): Result<string[], CompilationError> {
  const allUids = collectNodeUids(document.root);
  const resolved: string[] = [];

  for (const target of group.targets) {
    if (target.type === 'element') {
      if (!allUids.has(target.nodeUid)) {
        return err(
          new CompilationError(
            `Target nodeUid "${target.nodeUid}" not found in document`,
            'TARGET_NOT_FOUND',
          ),
        );
      }
      resolved.push(target.nodeUid);
    } else if (target.type === 'named-set') {
      // Named sets are not resolved at this stage; they would need a name registry.
      // For now, we report an error if no matching elements exist.
      return err(
        new CompilationError(
          `Named-set target "${target.name}" resolution is not yet supported`,
          'NAMED_SET_UNSUPPORTED',
        ),
      );
    }
  }

  return ok(resolved);
}

/**
 * Map AnimationGroup FillMode → channel FillMode.
 * Groups don't specify fill mode directly, so we default to 'forwards'.
 */
function defaultFillMode(): FillMode {
  return 'forwards';
}

/**
 * Expand a list of AnimationGroups into ResolvedChannels.
 * Each group is expanded into channels for each of its target elements.
 */
export function expandGroups(
  groups: AnimationGroup[],
  document: SvgDocument,
): Result<ResolvedChannel[], CompilationError> {
  const allChannels: ResolvedChannel[] = [];

  for (const group of groups) {
    const targetsResult = resolveTargets(group, document);
    if (!targetsResult.ok) {
      return targetsResult;
    }

    const timing = {
      duration: group.duration,
      delay: group.startTime,
      repeatCount: group.repeatCount,
      fill: defaultFillMode(),
    };

    let channels: AnimationChannel[];
    try {
      channels = getEffectChannels(group.effectType, timing);
    } catch (e) {
      if (e instanceof CompilationError) {
        return err(e);
      }
      throw e;
    }

    for (const nodeUid of targetsResult.value) {
      for (const channel of channels) {
        allChannels.push({ nodeUid, channel });
      }
    }
  }

  return ok(allChannels);
}
