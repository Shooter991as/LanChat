// Mirrors backend/utils/validatePassword.js — keep both in sync if the rule changes.
export const PASSWORD_RULES_MESSAGE =
  "At least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.";

export function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password) {
  const checks = getPasswordChecks(password);
  return Object.values(checks).every(Boolean);
}
