/**
 * User HTTP contracts.
 */

import type { UserPublic } from '../domain/user';
import type { PagedResponse } from './pagination';

/** Response to GET /me. */
export interface MeResponseDto {
  user: UserPublic;
}

/** Partial update applied through PATCH /me. */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  locale?: string;
}

/** Response for GET /users/:id or listings. */
export interface UserResponseDto {
  user: UserPublic;
}

export type ListUsersResponse = PagedResponse<UserPublic>;
