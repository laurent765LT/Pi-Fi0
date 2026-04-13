import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * OrgIsolationGuard ensures that users can only access data
 * belonging to their organization. Applied on endpoints that
 * return org-scoped data.
 *
 * The guard reads `user.orgId` from the request (set by JwtAuthGuard)
 * and attaches it to `request.orgId` for use in services.
 */
@Injectable()
export class OrgIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Super admins can access all orgs
    if (user.role === 'SUPER_ADMIN') {
      // If orgId is explicitly passed as query param, use it
      request.orgId = request.query?.orgId || null;
      return true;
    }

    // Regular users are restricted to their org
    request.orgId = user.orgId;
    return !!user.orgId;
  }
}
