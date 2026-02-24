/**
 * Base error for all compilation-related failures.
 */
export class CompilationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'COMPILATION_ERROR') {
    super(message);
    this.name = 'CompilationError';
    this.code = code;
  }
}

/**
 * Raised when pre- or post-compilation validation fails.
 */
export class ValidationError extends CompilationError {
  public readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Raised when two animation channels attempt to drive the same property
 * on the same element.
 */
export class BackendConflictError extends CompilationError {
  public readonly nodeUid: string;
  public readonly property: string;

  constructor(nodeUid: string, property: string) {
    super(
      `Backend conflict: property "${property}" on element "${nodeUid}" is animated by multiple channels`,
      'BACKEND_CONFLICT',
    );
    this.name = 'BackendConflictError';
    this.nodeUid = nodeUid;
    this.property = property;
  }
}
