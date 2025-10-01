import { z } from "zod";

// Password validation regex patterns
const PASSWORD_PATTERNS = {
  minLength: /.{6,}/,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/,
  hasNumber: /[0-9]/,
};

// Password strength validation function
export const validatePasswordStrength = (password: string) => {
  const errors: string[] = [];
  
  if (!PASSWORD_PATTERNS.minLength.test(password)) {
    errors.push("Password must be at least 6 characters long");
  }
  
  if (!PASSWORD_PATTERNS.hasUppercase.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!PASSWORD_PATTERNS.hasLowercase.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!PASSWORD_PATTERNS.hasSpecialChar.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
};

// Calculate password strength score (0-100)
export const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  
  // Length score (0-30 points)
  if (password.length >= 6) score += 10;
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  
  // Character variety score (0-40 points)
  if (PASSWORD_PATTERNS.hasUppercase.test(password)) score += 10;
  if (PASSWORD_PATTERNS.hasLowercase.test(password)) score += 10;
  if (PASSWORD_PATTERNS.hasNumber.test(password)) score += 10;
  if (PASSWORD_PATTERNS.hasSpecialChar.test(password)) score += 10;
  
  // Complexity score (0-30 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score += 15;
  if (uniqueChars >= 12) score += 15;
  
  return Math.min(score, 100);
};

// Get password strength label
export const getPasswordStrengthLabel = (strength: number): string => {
  if (strength < 30) return "Very Weak";
  if (strength < 50) return "Weak";
  if (strength < 70) return "Fair";
  if (strength < 90) return "Good";
  return "Strong";
};

// Get password strength color
export const getPasswordStrengthColor = (strength: number): string => {
  if (strength < 30) return "text-red-500";
  if (strength < 50) return "text-orange-500";
  if (strength < 70) return "text-yellow-500";
  if (strength < 90) return "text-blue-500";
  return "text-green-500";
};

// Generate secure password for OAuth users
export const generateSecurePassword = (): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  
  let password = "";
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill remaining length with random characters
  const allChars = uppercase + lowercase + numbers + specialChars;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Zod password validation schema
export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/, "Password must contain at least one special character");
