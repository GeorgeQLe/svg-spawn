/**
 * Allowed SVG element tag names.
 */
export const ALLOWED_ELEMENTS = new Set([
  // Structural
  'svg',
  'g',
  'defs',
  'use',
  'symbol',
  // Shape primitives
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'path',
  // Text
  'text',
  'tspan',
  'textPath',
  // Embedded content
  'image',
  // Clipping & masking
  'clipPath',
  'mask',
  // Paint servers
  'pattern',
  'linearGradient',
  'radialGradient',
  'stop',
  // Filters
  'filter',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  // Animation
  'animate',
  'animateTransform',
  'animateMotion',
  'set',
  // Descriptive / metadata
  'style',
  'title',
  'desc',
  'metadata',
  // Marker
  'marker',
]);

/**
 * Elements that are explicitly forbidden and must be stripped.
 */
export const FORBIDDEN_ELEMENTS = new Set([
  'script',
  'foreignObject',
  'iframe',
]);

/**
 * Allowed SVG attributes. This is a broad allowlist covering
 * standard SVG presentation, geometry, and structural attributes.
 */
export const ALLOWED_ATTRIBUTES = new Set([
  // Core attributes
  'id',
  'class',
  'style',
  'lang',
  'tabindex',
  // Presentation attributes
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-miterlimit',
  'opacity',
  'color',
  'display',
  'visibility',
  'overflow',
  'clip',
  'clip-path',
  'clip-rule',
  'mask',
  'filter',
  'flood-color',
  'flood-opacity',
  'lighting-color',
  'color-interpolation',
  'color-interpolation-filters',
  'font-family',
  'font-size',
  'font-style',
  'font-variant',
  'font-weight',
  'font-stretch',
  'font-size-adjust',
  'text-anchor',
  'text-decoration',
  'dominant-baseline',
  'alignment-baseline',
  'baseline-shift',
  'direction',
  'letter-spacing',
  'word-spacing',
  'writing-mode',
  'glyph-orientation-horizontal',
  'glyph-orientation-vertical',
  'unicode-bidi',
  'paint-order',
  'shape-rendering',
  'image-rendering',
  'text-rendering',
  'pointer-events',
  'stop-color',
  'stop-opacity',
  'marker-start',
  'marker-mid',
  'marker-end',
  // Geometry attributes
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'dx',
  'dy',
  'points',
  'd',
  'pathLength',
  // Viewbox & coordinate system
  'viewBox',
  'preserveAspectRatio',
  'transform',
  'transform-origin',
  // Reference attributes
  'href',
  'xlink:href',
  // Gradient / pattern attributes
  'gradientUnits',
  'gradientTransform',
  'spreadMethod',
  'fx',
  'fy',
  'offset',
  'patternUnits',
  'patternContentUnits',
  'patternTransform',
  // Filter attributes
  'filterUnits',
  'primitiveUnits',
  'in',
  'in2',
  'result',
  'type',
  'values',
  'mode',
  'operator',
  'k1',
  'k2',
  'k3',
  'k4',
  'stdDeviation',
  'dx',
  'dy',
  'edgeMode',
  'kernelMatrix',
  'order',
  'divisor',
  'bias',
  'targetX',
  'targetY',
  'kernelUnitLength',
  'preserveAlpha',
  'surfaceScale',
  'diffuseConstant',
  'specularConstant',
  'specularExponent',
  'limitingConeAngle',
  'azimuth',
  'elevation',
  'pointsAtX',
  'pointsAtY',
  'pointsAtZ',
  'baseFrequency',
  'numOctaves',
  'seed',
  'stitchTiles',
  'scale',
  'xChannelSelector',
  'yChannelSelector',
  // Clip path / mask attributes
  'clipPathUnits',
  'maskUnits',
  'maskContentUnits',
  // Animation attributes
  'attributeName',
  'attributeType',
  'from',
  'to',
  'by',
  'begin',
  'dur',
  'end',
  'min',
  'max',
  'restart',
  'repeatCount',
  'repeatDur',
  'fill',
  'calcMode',
  'keyTimes',
  'keySplines',
  'keyPoints',
  'additive',
  'accumulate',
  'rotate',
  'path',
  // Symbol / use attributes
  'refX',
  'refY',
  'markerWidth',
  'markerHeight',
  'markerUnits',
  'orient',
  // Namespace attributes
  'xmlns',
  'xmlns:xlink',
  'xmlns:svg',
  'xml:space',
  'xml:lang',
  // Misc
  'data-*', // Note: we handle data-* attributes via prefix check
  'role',
  'aria-label',
  'aria-hidden',
  'aria-labelledby',
  'aria-describedby',
  'version',
  'baseProfile',
]);

/**
 * Check if an attribute name is allowed.
 * Handles data-* attributes via prefix check and on* event handler rejection.
 */
export function isAllowedAttribute(attrName: string): boolean {
  // Always reject event handlers
  if (attrName.startsWith('on')) {
    return false;
  }

  // Allow data-* attributes
  if (attrName.startsWith('data-')) {
    return true;
  }

  return ALLOWED_ATTRIBUTES.has(attrName);
}
