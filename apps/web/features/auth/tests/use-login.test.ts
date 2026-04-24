// ─── useLogin — smoke test against a mocked authApi ──────────────────────────
// We hoist `vi.mock` for `../api` so `useLogin` resolves our stubbed
// `authApi.login` instead of hitting the real client.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { AuthError, AuthErrorCode } from '../lib/auth.errors';

const loginMock = vi.fn();

vi.mock('../api', () => ({
  authApi: {
    login: (...args: unknown[]) => loginMock(...args),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
  },
}));

// Import after the mock is registered so the hook sees the stub.
import { useLogin } from '../hooks/use-login';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useLogin', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('resolves with the server AuthResponse on success', async () => {
    const payload = {
      accessToken: 'a',
      refreshToken: 'r',
      user: {
        id: 'u1',
        email: 'x@y.com',
        firstName: 'X',
        lastName: 'Y',
        role: 'VIEWER',
      },
    };
    loginMock.mockResolvedValueOnce(payload);

    const { result } = renderHook(() => useLogin(), { wrapper });

    let returned: unknown;
    await act(async () => {
      returned = await result.current.mutateAsync({
        email: 'x@y.com',
        password: 'Abc12345',
      });
    });

    expect(returned).toEqual(payload);
    expect(loginMock).toHaveBeenCalledWith({
      email: 'x@y.com',
      password: 'Abc12345',
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(payload);
    });
  });

  it('wraps 401 errors as AuthError(INVALID_CREDENTIALS)', async () => {
    loginMock.mockRejectedValueOnce(
      Object.assign(new Error('Unauthorized'), { status: 401 }),
    );

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current
        .mutateAsync({ email: 'x@y.com', password: 'bad' })
        .catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(AuthError);
    });
    expect((result.current.error as AuthError).code).toBe(
      AuthErrorCode.INVALID_CREDENTIALS,
    );
  });

  it('wraps network-less errors as NETWORK_ERROR', async () => {
    loginMock.mockRejectedValueOnce(new Error('fetch failed'));

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current
        .mutateAsync({ email: 'x@y.com', password: 'Abc12345' })
        .catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(AuthError);
    });
    expect((result.current.error as AuthError).code).toBe(
      AuthErrorCode.NETWORK_ERROR,
    );
  });
});
