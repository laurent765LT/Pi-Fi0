// ─── Auth feature — error types ──────────────────────────────────────────────
// Typed error codes the feature surfaces to consumers. Map backend error
// codes to these whenever possible so UI labels can react to the union
// exhaustively.

export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  RATE_LIMITED: 'RATE_LIMITED',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/**
 * Domain error for auth flows. Throw an `AuthError` from hooks/api so that
 * forms can discriminate on `error.code` instead of stringly comparing
 * messages.
 */
export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly cause?: unknown;

  constructor(code: AuthErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.cause = cause;
  }

  /**
   * Narrow an unknown error into an `AuthError`. Returns the original
   * error as-is if it's already an `AuthError`, otherwise wraps it with
   * the `UNKNOWN` code.
   */
  static from(err: unknown): AuthError {
    if (err instanceof AuthError) return err;
    const message =
      err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
    return new AuthError(AuthErrorCode.UNKNOWN, message, err);
  }
}
