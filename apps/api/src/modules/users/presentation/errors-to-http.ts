import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import {
  EmailAlreadyTakenError,
  InvalidEmailError,
  UserNotFoundError,
} from '../domain/errors';

/**
 * Translates domain errors into HTTP exceptions. Controllers wrap their
 * handler calls with `mapDomainError` so the HTTP mapping stays in the
 * presentation layer — the application and domain layers know nothing
 * about status codes.
 */
export function mapDomainError(err: unknown): HttpException {
  if (err instanceof EmailAlreadyTakenError) {
    return new ConflictException({ code: err.code, message: err.message });
  }
  if (err instanceof UserNotFoundError) {
    return new NotFoundException({ code: err.code, message: err.message });
  }
  if (err instanceof InvalidEmailError) {
    return new BadRequestException({ code: err.code, message: err.message });
  }
  if (err instanceof HttpException) return err;
  throw err as Error;
}

/**
 * Wrap a handler promise and translate domain errors along the way.
 */
export async function withHttpErrorMapping<T>(
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw mapDomainError(err);
  }
}
