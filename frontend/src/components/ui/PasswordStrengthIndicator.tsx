"use client";

import React from "react";
import { 
  validatePasswordStrength, 
  getPasswordStrengthLabel, 
  getPasswordStrengthColor 
} from "@/utils/passwordValidation";

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showDetails = true,
}) => {
  if (!password) return null;

  const { strength } = validatePasswordStrength(password);
  const strengthLabel = getPasswordStrengthLabel(strength);
  const strengthColor = getPasswordStrengthColor(strength);

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              strength < 30
                ? "bg-red-500"
                : strength < 50
                ? "bg-orange-500"
                : strength < 70
                ? "bg-yellow-500"
                : strength < 90
                ? "bg-blue-500"
                : "bg-green-500"
            }`}
            style={{ width: `${strength}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${strengthColor}`}>
          {strengthLabel}
        </span>
      </div>

      {/* Password Requirements */}
      {showDetails && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600 font-medium">Password must contain:</p>
          <ul className="text-xs space-y-1">
            <li className={`flex items-center gap-2 ${
              password.length >= 6 ? "text-green-600" : "text-red-500"
            }`}>
              <span className="w-1 h-1 rounded-full bg-current" />
              At least 6 characters
            </li>
            <li className={`flex items-center gap-2 ${
              /[A-Z]/.test(password) ? "text-green-600" : "text-red-500"
            }`}>
              <span className="w-1 h-1 rounded-full bg-current" />
              One uppercase letter
            </li>
            <li className={`flex items-center gap-2 ${
              /[a-z]/.test(password) ? "text-green-600" : "text-red-500"
            }`}>
              <span className="w-1 h-1 rounded-full bg-current" />
              One lowercase letter
            </li>
            <li className={`flex items-center gap-2 ${
              /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password) ? "text-green-600" : "text-red-500"
            }`}>
              <span className="w-1 h-1 rounded-full bg-current" />
              One special character
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
