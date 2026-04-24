// ─── features/auth — public API ──────────────────────────────────────────────
// The only import surface external code should reach for. Anything not
// re-exported here is private to the feature. Imports from sibling feature
// internals (`features/auth/api/...`, `features/auth/lib/...`, etc.) should
// be avoided from outside the feature.

// Hooks
export {
  useAuth,
  useUser,
  useLogin,
  useLogout,
  useRegister,
  useCurrentUser,
  prefetchCurrentUser,
  currentUserKey,
} from './hooks';
export type { UseAuthResult } from './hooks';

// Store (legacy Zustand — prefer `useAuth` for reads)
export { useAuthStore, selectIsAuthenticated } from './store';

// Components
export {
  LoginForm,
  RegisterForm,
  PasswordStrength,
  AuthGuard,
} from './components';
export type { LoginFormProps, RegisterFormProps } from './components';

// Types
export type {
  AuthUser,
  AuthTokens,
  LoginCredentials,
  RegisterInput,
  AuthResponse,
  PasswordStrength as PasswordStrengthLevel,
  PasswordCheckResult,
} from './lib';
export { AuthError, AuthErrorCode, PASSWORD_RULES, checkPassword, getPasswordRegex } from './lib';

// API (exposed for integration tests / edge cases — prefer hooks)
export { authApi } from './api';
export type { AuthApi } from './api';
