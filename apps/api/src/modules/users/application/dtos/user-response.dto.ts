/**
 * Shape returned to API clients. The domain entity is NEVER serialised
 * directly — this DTO is what the presentation layer ships over the wire.
 *
 * It is intentionally a plain interface (no class-validator decorators)
 * because it only travels OUT of the API. Inbound bodies live in the
 * command classes.
 */
export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  orgId: string;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}
