/**
 * Validates password according to rules:
 * - Minimum 8 characters
 * - At least 1 capital letter
 * - At least 1 small letter
 * - At least 1 symbol
 */
export interface PasswordValidationErrors {
  length?: string;
  capital?: string;
  small?: string;
  symbol?: string;
}

export const validatePassword = (
  password: string
): PasswordValidationErrors => {
  const errors: PasswordValidationErrors = {};

  if (!password) {
    return { length: "Password is required" };
  }

  if (password.length < 8) {
    errors.length = "Password must be at least 8 characters long";
  }

  if (!/[A-Z]/.test(password)) {
    errors.capital = "Password must contain at least one capital letter";
  }

  if (!/[a-z]/.test(password)) {
    errors.small = "Password must contain at least one small letter";
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.symbol = "Password must contain at least one symbol";
  }

  return errors;
};

export const isPasswordValid = (password: string): boolean => {
  const errors = validatePassword(password);
  return Object.keys(errors).length === 0;
};

export const getPasswordRequirementsText = (): string => {
  return "Password must be at least 8 characters long and contain at least one capital letter, one small letter, and one symbol";
};

