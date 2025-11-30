import { AppError } from "../middlewares/error.middleware";

/**
 * Validates password according to rules:
 * - Minimum 8 characters
 * - At least 1 capital letter
 * - At least 1 small letter
 * - At least 1 symbol
 */
export const validatePassword = (password: string): void => {
  if (!password) {
    throw new AppError("Password is required", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters long", 400);
  }

  if (!/[A-Z]/.test(password)) {
    throw new AppError(
      "Password must contain at least one capital letter",
      400
    );
  }

  if (!/[a-z]/.test(password)) {
    throw new AppError("Password must contain at least one small letter", 400);
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    throw new AppError("Password must contain at least one symbol", 400);
  }
};

/**
 * Returns password validation errors as an object (for frontend use)
 */
export const getPasswordValidationErrors = (
  password: string
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!password) {
    errors.password = "Password is required";
    return errors;
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
