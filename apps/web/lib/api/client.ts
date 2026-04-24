// ─── Unified HTTP client ─────────────────────────────────────────────────────
// Lightweight fetch wrapper used by the `resources/*` modules.
//
// Behaviour:
// - Reads base URL from `NEXT_PUBLIC_API_URL` (falls back to `/api/v1`).
// - Attaches the bearer token from the `AUTH_COOKIE_NAME` cookie (default
//   `strickin_access`) OR from a token set via `apiClient.setToken(...)`
//   — whichever the auth layer installed first.
// - On 401, tries the refresh endpoint once then retries the original call.
// - Throws a typed `ApiError` with `{ status, code, message }`.
// - 30s default timeout (via AbortController).
//
// The Zustand auth store + the upcoming `useAuth()` hook can both feed tokens
// into this client without knowing about each other.

import type { AuthTokens } from './types';

const DEFAULT_TIMEOUT_MS = 30_000;
const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || 'strickin_access';

export interface ApiErrorPayload {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

export interface RequestOptions {
  /** Abort the request after this many ms. Defaults to 30s. */
  timeoutMs?: number;
  /** Bypass the automatic 401 → refresh → retry loop (used for the refresh call itself). */
  skipAuthRefresh?: boolean;
  /** Extra headers merged into the request. */
  headers?: Record<string, string>;
  /** Explicit token override (rarely needed — normally the cookie/state is used). */
  token?: string | null;
}

// ── Token resolution ─────────────────────────────────────────────────────────
// We support two sources in priority order:
//  1. A token set via `apiClient.setToken(...)` (React state / memory).
//  2. The `strickin_access` cookie (set by the backend or auth hook).
//
// Some older code reads the Zustand store token via `api.setToken(...)` —
// mirror that by exposing `setToken` on this client so the auth store can
// keep functioning unchanged when `NEXT_PUBLIC_USE_REAL_API=false`.

let inMemoryToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const p = part.trim();
    if (p.startsWith(prefix)) {
      return decodeURIComponent(p.slice(prefix.length));
    }
  }
  return null;
}

function currentAccessToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  return readCookie(AUTH_COOKIE_NAME);
}

function currentRefreshToken(): string | null {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;
  return readCookie(`${AUTH_COOKIE_NAME}_refresh`);
}

// ── Config helpers ──────────────────────────────────────────────────────────

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/$/, '');
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!params) return `${baseUrl()}${p}`;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${baseUrl()}${p}?${qs}` : `${baseUrl()}${p}`;
}

async function parseError(res: Response): Promise<ApiError> {
  let payload: { message?: string; code?: string; details?: unknown } = {};
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    // Non-JSON body — keep defaults.
  }
  return new ApiError({
    status: res.status,
    code: payload.code,
    message:
      payload.message ??
      (res.status === 401
        ? 'Session expirée. Veuillez vous reconnecter.'
        : `Erreur ${res.status}`),
    details: payload.details,
  });
}

// ── Refresh logic ───────────────────────────────────────────────────────────
// We coalesce concurrent 401s into a single refresh call.

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function performRefresh(): Promise<AuthTokens | null> {
  const refreshToken = currentRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${baseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });
    if (!res.ok) return null;
    const tokens = (await res.json()) as AuthTokens;
    inMemoryToken = tokens.accessToken;
    inMemoryRefreshToken = tokens.refreshToken;
    return tokens;
  } catch {
    return null;
  }
}

async function tryRefresh(): Promise<AuthTokens | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Core request function ───────────────────────────────────────────────────

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  opts: {
    params?: Record<string, unknown>;
    body?: unknown;
  } & RequestOptions = {},
): Promise<T> {
  const {
    params,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipAuthRefresh,
    headers: extraHeaders,
    token,
  } = opts;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...extraHeaders,
  };

  const auth = token !== undefined ? token : currentAccessToken();
  if (auth) {
    headers['Authorization'] = `Bearer ${auth}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'include',
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError({
        status: 0,
        code: 'TIMEOUT',
        message: `La requête a expiré (${timeoutMs}ms).`,
      });
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Impossible de contacter le serveur.',
      details: err,
    });
  }
  clearTimeout(timeout);

  // Attempt refresh on 401 (once).
  if (res.status === 401 && !skipAuthRefresh) {
    const tokens = await tryRefresh();
    if (tokens) {
      return request<T>(method, path, { ...opts, skipAuthRefresh: true });
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;

  // Some endpoints return text; guard for that.
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

// ── Public client ───────────────────────────────────────────────────────────

export interface ApiClient {
  setToken: (access: string | null, refresh?: string | null) => void;
  clearTokens: () => void;
  get: <T>(
    path: string,
    params?: Record<string, unknown>,
    opts?: RequestOptions,
  ) => Promise<T>;
  post: <T>(
    path: string,
    body?: unknown,
    opts?: RequestOptions,
  ) => Promise<T>;
  patch: <T>(
    path: string,
    body?: unknown,
    opts?: RequestOptions,
  ) => Promise<T>;
  put: <T>(
    path: string,
    body?: unknown,
    opts?: RequestOptions,
  ) => Promise<T>;
  delete: <T>(path: string, opts?: RequestOptions) => Promise<T>;
}

export const apiClient: ApiClient = {
  setToken(access, refresh) {
    inMemoryToken = access;
    if (refresh !== undefined) inMemoryRefreshToken = refresh;
  },
  clearTokens() {
    inMemoryToken = null;
    inMemoryRefreshToken = null;
  },
  get: <T>(path: string, params?: Record<string, unknown>, opts?: RequestOptions) =>
    request<T>('GET', path, { ...opts, params }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>('DELETE', path, opts),
};

/** Returns true if the feature flag `NEXT_PUBLIC_USE_REAL_API` is enabled. */
export function useRealApi(): boolean {
  return process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
}
