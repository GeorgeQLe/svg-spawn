import type { CompilationBackend, Result } from '@svg-spawn/core';
import { ok, err } from '@svg-spawn/core';
import type { ResolvedChannel } from '../group-compiler/expand-groups.js';
import { BackendConflictError } from '../errors.js';

/**
 * Properties that are best handled by CSS animations.
 */
const CSS_PROPERTIES = new Set([
  'opacity',
  'transform',
  'transform:translateX',
  'transform:translateY',
  'transform:rotate',
  'transform:scale',
  'fill',
  'stroke',
]);

/**
 * Properties that must be handled by SMIL.
 */
const SMIL_PROPERTIES = new Set([
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'width',
  'height',
  'points',
  'viewBox',
  'stroke-dashoffset',
  'stroke-dasharray',
  'animateMotion',
]);

export type ResolvedBackend = 'smil' | 'css';

export interface BackendAssignment {
  nodeUid: string;
  channel: ResolvedChannel['channel'];
  backend: ResolvedBackend;
}

/**
 * Determine the backend for a given property, respecting explicit preferences.
 */
export function selectBackendForProperty(
  property: string,
  preference: CompilationBackend,
): ResolvedBackend {
  if (preference === 'smil') return 'smil';
  if (preference === 'css') return 'css';

  // auto mode: select based on property
  if (SMIL_PROPERTIES.has(property)) return 'smil';
  if (CSS_PROPERTIES.has(property)) return 'css';

  // For transform sub-properties
  if (property.startsWith('transform:')) return 'css';

  // Custom CSS properties
  if (property.startsWith('--')) return 'css';

  // Default to SMIL for unknown SVG attributes
  return 'smil';
}

/**
 * Assign backends to all resolved channels.
 * Detects conflicts: same property on same element animated by multiple channels.
 */
export function assignBackends(
  channels: ResolvedChannel[],
): Result<BackendAssignment[], BackendConflictError> {
  const assignments: BackendAssignment[] = [];
  const ownerMap = new Map<string, string>(); // "nodeUid:property" → groupId marker

  for (const resolved of channels) {
    const key = `${resolved.nodeUid}:${resolved.channel.property}`;
    if (ownerMap.has(key)) {
      return err(new BackendConflictError(resolved.nodeUid, resolved.channel.property));
    }
    ownerMap.set(key, 'assigned');

    const backend = selectBackendForProperty(
      resolved.channel.property,
      resolved.channel.compilationBackend,
    );

    assignments.push({
      nodeUid: resolved.nodeUid,
      channel: resolved.channel,
      backend,
    });
  }

  return ok(assignments);
}
