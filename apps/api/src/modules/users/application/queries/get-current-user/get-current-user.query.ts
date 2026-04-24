/**
 * Query input for GetCurrentUser. The `userId` value is extracted from the
 * authenticated principal by the controller.
 */
export class GetCurrentUserQuery {
  constructor(public readonly userId: string) {}
}
