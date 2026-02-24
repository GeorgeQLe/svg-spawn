import type { BackendAssignment } from '../backend/select-backend.js';
import { getEasing } from '../group-compiler/easing-library.js';
import type { EasingPreset } from '@svg-spawn/core';

/**
 * Generate a scoped animation name.
 */
function scopedName(nodeUid: string, property: string): string {
  // Replace colons and other non-alphanumeric chars with dashes
  const safeProp = property.replace(/[^a-zA-Z0-9]/g, '-');
  return `svgs-${nodeUid}-${safeProp}`;
}

/**
 * Convert a keyframe value to a CSS value.
 */
function toCssValue(value: string | number, property: string): string {
  if (property.startsWith('transform:')) {
    const subType = property.split(':')[1]!;
    const val = String(value);
    switch (subType) {
      case 'translateX':
        return `translateX(${val.includes('px') ? val : val + 'px'})`;
      case 'translateY':
        return `translateY(${val.includes('px') ? val : val + 'px'})`;
      case 'rotate':
        return `rotate(${val.includes('deg') ? val : val + 'deg'})`;
      case 'scale':
        return `scale(${val})`;
      default:
        return `${subType}(${val})`;
    }
  }
  return String(value);
}

/**
 * Determine the CSS property name for an animation property.
 */
function toCssProperty(property: string): string {
  if (property.startsWith('transform:')) return 'transform';
  return property;
}

/**
 * Map channel fill mode to CSS animation-fill-mode.
 */
function toCssFillMode(fill: string): string {
  switch (fill) {
    case 'forwards':
      return 'forwards';
    case 'backwards':
      return 'backwards';
    case 'both':
      return 'both';
    case 'freeze':
      return 'forwards';
    case 'none':
    case 'remove':
      return 'none';
    default:
      return 'none';
  }
}

/**
 * Map repeat count to CSS animation-iteration-count.
 */
function toCssIterationCount(repeatCount: number | 'indefinite'): string {
  if (repeatCount === 'indefinite') return 'infinite';
  return String(repeatCount);
}

/**
 * Guess an easing preset from a channel's first keyframe easing.
 */
function guessEasingPreset(assignment: BackendAssignment): EasingPreset {
  const firstEasing = assignment.channel.keyframes[0]?.easing;
  if (!firstEasing) return 'linear';
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
 * Generate CSS from CSS-backend assignments.
 * Returns a complete `<style>` block string.
 */
export function generateCss(assignments: BackendAssignment[]): string {
  const cssAssignments = assignments.filter((a) => a.backend === 'css');

  if (cssAssignments.length === 0) return '';

  const keyframesBlocks: string[] = [];
  const ruleBlocks: string[] = [];
  const reducedMotionRules: string[] = [];

  for (const assignment of cssAssignments) {
    const { nodeUid, channel } = assignment;
    const animName = scopedName(nodeUid, channel.property);
    const cssProp = toCssProperty(channel.property);

    // Build @keyframes
    const keyframeEntries = channel.keyframes
      .map((kf) => {
        const pct = kf.offset === 0 ? '0%' : kf.offset === 1 ? '100%' : `${kf.offset * 100}%`;
        const val = toCssValue(kf.value, channel.property);
        return `  ${pct} { ${cssProp}: ${val}; }`;
      })
      .join('\n');
    keyframesBlocks.push(`@keyframes ${animName} {\n${keyframeEntries}\n}`);

    // Build animation rule
    const easingPreset = guessEasingPreset(assignment);
    const easing = getEasing(easingPreset);
    const fillMode = toCssFillMode(channel.fill);
    const iterCount = toCssIterationCount(channel.repeatCount);

    ruleBlocks.push(
      `[data-uid="${nodeUid}"] {\n  animation: ${animName} ${channel.duration}ms ${easing.css} ${channel.delay}ms ${iterCount} ${fillMode};\n}`,
    );

    // Reduced motion: pause or remove animation
    reducedMotionRules.push(
      `  [data-uid="${nodeUid}"] {\n    animation: none;\n  }`,
    );
  }

  const lines: string[] = [];
  lines.push(...keyframesBlocks);
  lines.push('');
  lines.push(...ruleBlocks);
  lines.push('');
  lines.push('@media (prefers-reduced-motion: reduce) {');
  lines.push(...reducedMotionRules);
  lines.push('}');

  return lines.join('\n');
}
