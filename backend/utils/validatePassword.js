// Strong password rule, shared across register + change-password:
// at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_RULES_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";

export function isStrongPassword(password) {
  return typeof password === "string" && STRONG_PASSWORD_REGEX.test(password);
}
