export type AiErrorCode = 'rate_limit' | 'auth' | 'timeout' | 'parse' | 'validation' | 'unknown';

export class AiError extends Error {
  constructor(
    message: string,
    public code: AiErrorCode,
  ) {
    super(message);
    this.name = 'AiError';
  }
}
