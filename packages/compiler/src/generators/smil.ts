import type { EasingPreset, FillMode } from '@svg-spawn/core';
import type { BackendAssignment } from '../backend/select-backend.js';
import { buildSmilKeySplines } from '../group-compiler/easing-library.js';

/**
 * A generated SMIL element to be inserted as a child of the target element.
 */
export interface SmilElement {
  nodeUid: string;
  elementString: string;
}

/**
 * Map channel fill mode to SMIL fill attribute.
 */
function toSmilFill(fill: FillMode): string {
  switch (fill) {
    case 'forwards':
    case 'both':
      return 'freeze';
    case 'freeze':
      return 'freeze';
    case 'none':
    case 'backwards':
    case 'remove':
      return 'remove';
    default:
      return 'remove';
  }
}

/**
 * Map repeat count to SMIL repeatCount attribute.
 */
function toSmilRepeatCount(repeatCount: number | 'indefinite'): string {
  if (repeatCount === 'indefinite') return 'indefinite';
  return String(repeatCount);
}

/**
 * Determine the SMIL element tag name based on the property.
 */
function getSmilTagName(property: string): string {
  if (property === 'animateMotion') return 'animateMotion';
  if (property.startsWith('transform:')) return 'animateTransform';
  return 'animate';
}

/**
 * Extract the transform type from a "transform:xxx" property name.
 */
function getTransformType(property: string): string {
  const parts = property.split(':');
  if (parts.length < 2) return 'translate';
  const subType = parts[1]!;
  switch (subType) {
    case 'translateX':
      return 'translate';
    case 'translateY':
      return 'translate';
    case 'rotate':
      return 'rotate';
    case 'scale':
      return 'scale';
    default:
      return subType;
  }
}

/**
 * Format keyframe values for SMIL.
 * For transforms, we need numeric values.
 */
function formatSmilValue(value: string | number, property: string): string {
  const str = String(value);
  // Strip units for SMIL numeric attributes
  if (property.startsWith('transform:')) {
    const numeric = str.replace(/px|deg|%/g, '');
    return numeric;
  }
  return str;
}

/**
 * Escape a string for use in XML attribute values.
 */
function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Guess an easing preset from a channel's keyframe easing strings.
 * We look at the first keyframe easing; defaults to linear.
 */
function guessEasingPreset(assignment: BackendAssignment): EasingPreset {
  const firstEasing = assignment.channel.keyframes[0]?.easing;
  if (!firstEasing) return 'linear';
  // Try to parse a known preset
  const knownPresets: EasingPreset[] = [
    'linear',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'spring',
    'bounce',
  ];
  if (knownPresets.includes(firstEasing as EasingPreset)) {
    return firstEasing as EasingPreset;
  }
  return 'linear';
}

/**
 * Generate SMIL animation elements from backend assignments.
 */
export function generateSmil(assignments: BackendAssignment[]): SmilElement[] {
  const smilAssignments = assignments.filter((a) => a.backend === 'smil');
  const elements: SmilElement[] = [];

  for (const assignment of smilAssignments) {
    const { nodeUid, channel } = assignment;
    const tagName = getSmilTagName(channel.property);

    const attrs: Record<string, string> = {};

    // Attribute name
    if (tagName === 'animateTransform') {
      attrs['attributeName'] = 'transform';
      attrs['type'] = getTransformType(channel.property);
    } else if (tagName === 'animateMotion') {
      // animateMotion doesn't use attributeName
    } else {
      attrs['attributeName'] = channel.property;
    }

    // Values and keyTimes
    const values = channel.keyframes
      .map((kf) => formatSmilValue(kf.value, channel.property))
      .join(';');
    const keyTimes = channel.keyframes.map((kf) => kf.offset).join(';');
    attrs['values'] = values;
    attrs['keyTimes'] = keyTimes;

    // Duration
    attrs['dur'] = `${channel.duration}ms`;

    // Delay via begin
    if (channel.delay > 0) {
      attrs['begin'] = `${channel.delay}ms`;
    }

    // Repeat count
    attrs['repeatCount'] = toSmilRepeatCount(channel.repeatCount);

    // Fill behavior
    attrs['fill'] = toSmilFill(channel.fill);

    // Easing via keySplines + calcMode
    const segmentCount = channel.keyframes.length - 1;
    if (segmentCount > 0) {
      const easingPreset = guessEasingPreset(assignment);
      const keySplines = buildSmilKeySplines(easingPreset, segmentCount);
      attrs['calcMode'] = 'spline';
      attrs['keySplines'] = keySplines;
    }

    // Build element string
    const attrString = Object.entries(attrs)
      .map(([k, v]) => `${k}="${escapeXmlAttr(v)}"`)
      .join(' ');
    const elementString = `<${tagName} ${attrString}/>`;

    elements.push({ nodeUid, elementString });
  }

  return elements;
}
