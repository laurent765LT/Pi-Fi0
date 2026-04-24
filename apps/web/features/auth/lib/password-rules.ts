// ─── Auth feature — password rules ───────────────────────────────────────────
// Single source of truth for password policy. The /register page currently
// duplicates these rules inline; new code should prefer the helpers exported
// here so any future policy change lands in one place.

export const PASSWORD_RULES = {
  /** Minimum length accepted by `POST /auth/register`. */
  minLength: 8,
  /** Length at which we consider the password "strong" (T1.4 target). */
  strongLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
  specialChars: '!@#$%^&*',
} as const;

/**
 * Strength score:
 * - 0 = empty / far below minimum
 * - 1 = weak (meets length only)
 * - 2 = medium (meets length + casing)
 * - 3 = strong (meets length + casing + digit)
 * - 4 = very strong (adds special char or 12+ chars)
 */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export interface PasswordCheckResult {
  valid: boolean;
  strength: PasswordStrength;
  violations: string[];
}

/**
 * Returns a regex that matches the minimum-acceptable password policy.
 * Useful for the `pattern` attribute on `<input>` elements.
 */
export function getPasswordRegex(): RegExp {
  const parts: string[] = [];
  if (PASSWORD_RULES.requireUppercase) parts.push('(?=.*[A-Z])');
  if (PASSWORD_RULES.requireLowercase) parts.push('(?=.*[a-z])');
  if (PASSWORD_RULES.requireNumber) parts.push('(?=.*\\d)');
  if (PASSWORD_RULES.requireSpecial) {
    const escaped = PASSWORD_RULES.specialChars.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      '\\$&',
    );
    parts.push(`(?=.*[${escaped}])`);
  }
  return new RegExp(`^${parts.join('')}.{${PASSWORD_RULES.minLength},}$`);
}

/**
 * Validate a password against the policy and return a descriptive result.
 *
 * The scoring is monotonic — each satisfied rule adds one to the strength,
 * capped at 4. This is what drives the `<PasswordStrength />` meter.
 */
export function checkPassword(password: string): PasswordCheckResult {
  const violations: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    violations.push(`${PASSWORD_RULES.minLength} caractères minimum`);
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    violations.push('Doit contenir une majuscule');
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    violations.push('Doit contenir une minuscule');
  }
  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    violations.push('Doit contenir un chiffre');
  }
  if (PASSWORD_RULES.requireSpecial) {
    const escaped = PASSWORD_RULES.specialChars.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      '\\$&',
    );
    if (!new RegExp(`[${escaped}]`).test(password)) {
      violations.push('Doit contenir un caractère spécial');
    }
  }

  let score = 0;
  if (password.length >= PASSWORD_RULES.minLength) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= PASSWORD_RULES.strongLength) {
    score += 1;
  }

  const strength = Math.min(score, 4) as PasswordStrength;

  return {
    valid: violations.length === 0,
    strength,
    violations,
  };
}
