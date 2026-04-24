/**
 * Representation of the authenticated principal attached to every request
 * that passes through `JwtAuthGuard`. It intentionally omits the password
 * hash and refresh token — those must never leak outside of AuthService.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  orgId: string;
}

/**
 * Payload encoded inside the JWT access token. `jti` is a random UUID that
 * allows us to trace a specific token instance through the audit log.
 */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  orgId: string;
  jti: string;
}

/**
 * Payload encoded inside the JWT refresh token. `rtid` is the DB row id of
 * the corresponding `RefreshToken` record — it lets us revoke the token by
 * id without decoding anything else.
 */
export interface RefreshTokenPayload {
  sub: string;
  rtid: string;
  jti: string;
}
