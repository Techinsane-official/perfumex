import crypto from "crypto";

/**
 * Generate a cryptographically secure CSRF token
 */
export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate CSRF token (basic implementation)
 * In production, you might want to store tokens in session/database
 */
export function validateCsrfToken(token: string): boolean {
  // Basic validation - token should be 64 characters (32 bytes as hex)
  return Boolean(token && token.length === 64 && /^[a-f0-9]+$/i.test(token));
}
