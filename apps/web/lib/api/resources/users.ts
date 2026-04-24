// ─── Users resource ──────────────────────────────────────────────────────────
// Thin typed wrappers around the `/users` endpoints.

import { apiClient } from '../client';
import type { User, UserUpdate } from '../types';

export const usersApi = {
  me: () => apiClient.get<User>('/users/me'),
  updateMe: (patch: Partial<UserUpdate>) =>
    apiClient.patch<User>('/users/me', patch),
};
