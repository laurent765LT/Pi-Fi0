/**
 * API error contracts.
 *
 * The server serialises all errors to the {@link ApiErrorBody} shape. Clients
 * can `throw` the {@link ApiError} class to reproduce the same semantics.
 */

/** Stable application-level error codes. */
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  UNPROCESSABLE: 'UNPROCESSABLE',
  INTERNAL: 'INTERNAL',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  /** Domain-specific: quota / capacity exhausted. */
  CAPACITY_EXHAUSTED: 'CAPACITY_EXHAUSTED',
  /** Domain-specific: duplicate idempotency key. */
  DUPLICATE_IDEMPOTENCY_KEY: 'DUPLICATE_IDEMPOTENCY_KEY',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Wire-level error body returned by every failing endpoint. */
export interface ApiErrorBody {
  code: ErrorCode | string;
  message: string;
  /** Optional field-level details for VALIDATION_ERROR. */
  details?: Record<string, string[]>;
  /** Request ID for log correlation. */
  requestId?: string;
}

/**
 * Runtime-throwable API error.
 *
 * Using a class (rather than a plain object) lets the web client detect the
 * error with `instanceof` in its error-boundaries / react-query hooks.
 */
export class ApiError extends Error {
  readonly code: ErrorCode | string;
  readonly status: number;
  readonly details?: Record<string, string[]>;
  readonly requestId?: string;

  constructor(
    code: ErrorCode | string,
    message: string,
    status: number,
    details?: Record<string, string[]>,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }

  /** Serialise to the wire body shape. */
  toBody(): ApiErrorBody {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      requestId: this.requestId,
    };
  }
}
