export function healthCheck(): string {
  return 'ok';
}

// Main compiler
export { compile } from './compile.js';

// Errors
export {
  CompilationError,
  ValidationError,
  BackendConflictError,
} from './errors.js';

// Group compiler
export { getEffectChannels, isKnownEffect } from './group-compiler/effect-library.js';
export { getEasing, buildSmilKeySplines } from './group-compiler/easing-library.js';
export { expandGroups } from './group-compiler/expand-groups.js';
export type { ResolvedChannel } from './group-compiler/expand-groups.js';

// Backend selection
export { selectBackendForProperty, assignBackends } from './backend/select-backend.js';
export type { BackendAssignment, ResolvedBackend } from './backend/select-backend.js';

// Generators
export { generateSmil } from './generators/smil.js';
export type { SmilElement } from './generators/smil.js';
export { generateCss } from './generators/css.js';

// Assembler
export { assemble } from './assembler.js';

// Validation
export { validatePlan } from './validation/validate-plan.js';
export { validateOutput } from './validation/validate-output.js';
