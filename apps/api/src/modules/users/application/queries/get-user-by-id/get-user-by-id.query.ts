/**
 * Query input for GetUserById. Simple object; no validation is required
 * because the controller only builds this after `JwtAuthGuard` has run.
 */
export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}
