'use client';

// ─── Auth feature — HTTP wrappers ────────────────────────────────────────────
// Thin typed wrappers around the `/auth/*` endpoints exposed by the NestJS
// backend. This is the only place in the feature that knows about URLs —
// hooks import from here, never from `@/lib/api/client` directly.

import { apiClient } from '@/lib/api/client';
import type {
  LoginCredentials,
  RegisterInput,
  AuthResponse,
  AuthUser,
} from '../lib/auth.types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login', credentials),

  register: (input: RegisterInput) =>
    apiClient.post<AuthResponse>('/auth/register', input),

  logout: () => apiClient.post<void>('/auth/logout'),

  refresh: () => apiClient.post<AuthResponse>('/auth/refresh'),

  me: () => apiClient.get<AuthUser>('/auth/me'),
};

export type AuthApi = typeof authApi;
