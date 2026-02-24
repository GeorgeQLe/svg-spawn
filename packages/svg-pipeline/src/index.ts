export { healthCheck } from './health-check.js';

// Main pipeline
export { processSvg } from './pipeline.js';
export type { PipelineOptions, PipelineResult, PipelineError } from './pipeline.js';

// Errors
export { ParseError, SanitizationError, ComplexityExceeded } from './errors.js';

// Parser
export { parseSvg } from './parser/index.js';
export { serializeSvg } from './parser/index.js';

// Sanitize
export { sanitize } from './sanitize/index.js';
export { ALLOWED_ELEMENTS, FORBIDDEN_ELEMENTS, ALLOWED_ATTRIBUTES } from './sanitize/index.js';

// Normalize
export { normalize } from './normalize/index.js';
export { assignUids } from './normalize/index.js';
export { computeFingerprints } from './normalize/index.js';

// Animation detection
export { detectAndStripAnimations } from './detect-animations.js';
export type { AnimationDetectionResult } from './detect-animations.js';

// Complexity
export { computeComplexityScore } from './complexity/index.js';
export { gateComplexity } from './complexity/index.js';

// Summary
export { extractSummary } from './summary/index.js';
