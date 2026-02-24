import type { SvgElement } from '@svg-spawn/core';

/**
 * SVG animation element tag names.
 */
const ANIMATION_ELEMENTS = new Set([
  'animate',
  'animateTransform',
  'animateMotion',
  'set',
]);

/**
 * Check if a <style> element's text content contains @keyframes rules.
 */
function hasKeyframes(textContent: string | undefined): boolean {
  if (!textContent) return false;
  return /@keyframes\s/i.test(textContent);
}

/**
 * Result of animation detection and stripping.
 */
export interface AnimationDetectionResult {
  /** The element tree with animation elements removed */
  tree: SvgElement;
  /** Whether any animations were found and stripped */
  hadAnimations: boolean;
}

/**
 * Scan the element tree for animation elements and CSS @keyframes.
 * For MVP: always strip existing animations (remove animation elements).
 * Returns the stripped tree and a flag indicating whether animations were found.
 */
export function detectAndStripAnimations(root: SvgElement): AnimationDetectionResult {
  let hadAnimations = false;

  function stripRecursive(element: SvgElement): SvgElement {
    // Check for @keyframes in <style> elements
    if (element.tagName === 'style' && hasKeyframes(element.textContent)) {
      hadAnimations = true;
      // Strip @keyframes rules from style content
      const cleanedContent = element.textContent!.replace(
        /@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/gi,
        '',
      ).trim();
      return {
        ...element,
        textContent: cleanedContent || undefined,
        children: element.children
          .filter((child) => {
            if (ANIMATION_ELEMENTS.has(child.tagName)) {
              hadAnimations = true;
              return false;
            }
            return true;
          })
          .map(stripRecursive),
      };
    }

    // Filter out animation elements from children
    const children: SvgElement[] = [];
    for (const child of element.children) {
      if (ANIMATION_ELEMENTS.has(child.tagName)) {
        hadAnimations = true;
        continue;
      }
      children.push(stripRecursive(child));
    }

    return {
      ...element,
      children,
    };
  }

  const tree = stripRecursive(root);
  return { tree, hadAnimations };
}
