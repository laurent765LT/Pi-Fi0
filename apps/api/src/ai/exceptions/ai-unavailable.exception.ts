import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Thrown by AiService when the upstream Claude API is unreachable,
 * rate-limited, or returns a fatal error. The controller catches this
 * and turns it into a 503 response with a user-friendly French message.
 */
export class AIUnavailableException extends HttpException {
  public readonly reason: string;
  public readonly upstreamCause: unknown;

  constructor(reason: string, upstreamCause?: unknown) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Service IA temporairement indisponible. Veuillez réessayer dans quelques instants.',
        reason,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    this.reason = reason;
    this.upstreamCause = upstreamCause;
  }
}
