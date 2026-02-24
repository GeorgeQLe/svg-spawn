/**
 * Error thrown when SVG XML parsing fails.
 */
export class ParseError extends Error {
  readonly code = 'PARSE_ERROR' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Error thrown when SVG sanitization discovers disallowed content.
 */
export class SanitizationError extends Error {
  readonly code = 'SANITIZATION_ERROR' as const;
  readonly violations: string[];

  constructor(message: string, violations: string[] = []) {
    super(message);
    this.name = 'SanitizationError';
    this.violations = violations;
  }
}

/**
 * Error thrown when SVG complexity exceeds the allowed threshold.
 */
export class ComplexityExceeded extends Error {
  readonly code = 'COMPLEXITY_EXCEEDED' as const;
  readonly score: number;
  readonly limit: number;

  constructor(score: number, limit: number) {
    super(`Complexity score ${score} exceeds limit of ${limit}`);
    this.name = 'ComplexityExceeded';
    this.score = score;
    this.limit = limit;
  }
}
