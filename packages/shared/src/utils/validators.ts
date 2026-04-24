/**
 * Pure validators — safe to call from browser + Node, no runtime deps.
 *
 * These are intentionally boolean functions so they can be plugged into Zod
 * `.refine()`, class-validator `@ValidateBy`, or ad-hoc server guards.
 */

/**
 * Check that a string is a valid ISIN (ISO 6166).
 *
 * Format: 2 letters (country) + 9 alphanumerics + 1 check digit.
 * Uses the modified Luhn check specified in the ISIN standard.
 */
export function isValidIsin(input: string): boolean {
  if (typeof input !== 'string') return false;
  const s = input.toUpperCase().trim();
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(s)) return false;

  // Expand letters to digits (A=10, B=11 … Z=35).
  let expanded = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      expanded += ch;
    } else if (code >= 65 && code <= 90) {
      expanded += String(code - 55);
    } else {
      return false;
    }
  }

  // Luhn, working right-to-left, doubling every second digit.
  let sum = 0;
  let double = false;
  for (let i = expanded.length - 1; i >= 0; i--) {
    const ch = expanded[i];
    if (ch === undefined) continue;
    let digit = Number(ch);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Check that a string is a valid ORIAS number.
 *
 * ORIAS registrations are 8-digit numeric identifiers. No public checksum is
 * published — we only enforce the length and charset.
 */
export function isValidOrias(input: string): boolean {
  if (typeof input !== 'string') return false;
  return /^\d{8}$/.test(input.trim());
}

/**
 * Check that a string is a valid French SIREN (9 digits + Luhn).
 */
export function isValidSiren(input: string): boolean {
  if (typeof input !== 'string') return false;
  const s = input.replace(/\s+/g, '');
  if (!/^\d{9}$/.test(s)) return false;
  return luhn(s);
}

/**
 * Check that a string is a valid French SIRET (SIREN + 5-digit NIC, Luhn).
 */
export function isValidSiret(input: string): boolean {
  if (typeof input !== 'string') return false;
  const s = input.replace(/\s+/g, '');
  if (!/^\d{14}$/.test(s)) return false;
  return luhn(s);
}

/**
 * Check that a string is a valid LEI (ISO 17442).
 *
 * Format: 18 alphanumerics + 2-digit check (mod-97-10).
 */
export function isValidLei(input: string): boolean {
  if (typeof input !== 'string') return false;
  const s = input.toUpperCase().trim();
  if (!/^[A-Z0-9]{18}\d{2}$/.test(s)) return false;

  // Expand A-Z to 10-35.
  let numeric = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) numeric += ch;
    else if (code >= 65 && code <= 90) numeric += String(code - 55);
    else return false;
  }
  return mod97(numeric) === 1;
}

/** Strict email check (local@domain.tld). */
export function isValidEmail(input: string): boolean {
  if (typeof input !== 'string') return false;
  // Conservative pattern — no TLD-less domains, no consecutive dots.
  return /^(?!.*\.\.)[A-Za-z0-9_'+\-]+(\.[A-Za-z0-9_'+\-]+)*@[A-Za-z0-9](-?[A-Za-z0-9])*(\.[A-Za-z0-9](-?[A-Za-z0-9])*)+$/.test(
    input.trim(),
  );
}

/**
 * Strick'in password policy:
 * - ≥ 12 characters
 * - ≥ 1 uppercase
 * - ≥ 1 digit
 * - ≥ 1 special among !@#$%^&*
 *
 * MUST stay in sync with `apps/api/src/auth/dto/register.dto.ts`.
 */
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,}$/;

export function isValidPassword(input: string): boolean {
  if (typeof input !== 'string') return false;
  return PASSWORD_REGEX.test(input);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    const ch = digits[i];
    if (ch === undefined) continue;
    let d = Number(ch);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function mod97(numeric: string): number {
  // Process in chunks to avoid BigInt dependency.
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = String(remainder) + numeric.slice(i, i + 7);
    remainder = Number(chunk) % 97;
  }
  return remainder;
}
