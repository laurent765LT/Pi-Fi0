# Auth Feature

Pilot "feature-based" module for Strick'in. Everything related to login,
registration, session management, and password policy is colocated here.

## Public API

Always import from the barrel — internal paths are not contractual and may
move without notice.

```ts
import {
  // Hooks
  useAuth,
  useUser,
  useLogin,
  useLogout,
  useRegister,
  useCurrentUser,
  prefetchCurrentUser,
  currentUserKey,

  // Store (legacy Zustand, still available for demo mode / setState writes)
  useAuthStore,
  selectIsAuthenticated,

  // Components
  LoginForm,
  RegisterForm,
  PasswordStrength,
  AuthGuard,

  // Types
  type AuthUser,
  type AuthTokens,
  type LoginCredentials,
  type RegisterInput,
  type AuthResponse,

  // Errors
  AuthError,
  AuthErrorCode,

  // Password rules
  PASSWORD_RULES,
  checkPassword,
  getPasswordRegex,

  // Low-level API (prefer hooks)
  authApi,
} from '@/features/auth';
```

## Directory structure

```
features/auth/
├── index.ts                   # Public API barrel
├── README.md                  # This file
├── api/
│   ├── auth.api.ts            # Thin typed wrappers around /auth/* endpoints
│   └── auth.api.types.ts      # Re-export of wire shapes from @strickin/shared
├── hooks/
│   ├── use-auth.ts            # Legacy-compat facade + useUser()
│   ├── use-login.ts           # POST /auth/login mutation
│   ├── use-logout.ts          # POST /auth/logout mutation
│   ├── use-register.ts        # POST /auth/register mutation
│   └── use-current-user.ts    # GET  /auth/me query
├── store/
│   └── auth.store.ts          # Zustand store (demo mode + middleware cookie)
├── components/
│   ├── login-form/            # Compact <LoginForm />
│   ├── register-form/         # Compact <RegisterForm />
│   ├── password-strength/     # Visual strength meter
│   └── auth-guard/            # UI-level role gate
├── lib/
│   ├── auth.types.ts          # Internal feature types
│   ├── auth.errors.ts         # AuthError class + AuthErrorCode enum
│   └── password-rules.ts      # Password policy + strength check
└── tests/
    ├── password-rules.test.ts
    └── use-login.test.ts
```

## Usage

### Read the current user

```tsx
import { useAuth, AuthGuard } from '@/features/auth';

function Profile() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <h1>Bonjour {user?.firstName}</h1>;
}
```

### Log in with the granular mutation

```tsx
import { useLogin, AuthError, AuthErrorCode } from '@/features/auth';

const login = useLogin();

await login.mutateAsync({ email, password }).catch((err: AuthError) => {
  if (err.code === AuthErrorCode.INVALID_CREDENTIALS) {
    setError('Identifiants incorrects.');
  }
});
```

### Protect a subtree

```tsx
import { AuthGuard } from '@/features/auth';
import { UserRole } from '@strickin/shared';

<AuthGuard requiredRole={[UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN]}>
  <AdminPanel />
</AuthGuard>
```

## Contributing

When you add a new auth endpoint:

1. Add the method to `api/auth.api.ts`.
2. Create a hook wrapper in `hooks/` (`use-<verb>.ts`).
3. Re-export from `hooks/index.ts` and from the root `index.ts`.
4. If it introduces a new error code, extend `AuthErrorCode` in
   `lib/auth.errors.ts`.
5. Add a test under `tests/`.
6. Update this README's "Public API" section.

## Back-compat shims

The legacy import paths remain live:

- `@/hooks/use-auth` → re-exports `useAuth` from this feature.
- `@/stores/auth-store` → re-exports `useAuthStore` from this feature.

They exist so the 20+ consumers that already depend on those paths keep
building. New code should import from `@/features/auth` instead.
