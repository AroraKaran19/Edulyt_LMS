"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";

/**
 * A row of single-digit boxes for entering an emailed code.
 *
 * Extracted from the signup verify step so the email-change modal gets the same
 * keyboard behaviour rather than a second, subtly different copy of it. The
 * fiddly parts worth having in one place:
 *
 *  - typing or pasting several digits at once fills forward from the box you
 *    are in, so an autofilled code lands correctly wherever focus happens to be
 *  - backspace in an empty box steps back and clears the previous digit, which
 *    is what every OTP field does and what people expect
 *  - only the first box advertises `one-time-code`, so the OS suggests the code
 *    once instead of six times
 *
 * The value is an array, not a string: clearing a box in the middle leaves a
 * hole ("1", "", "3") that a string cannot represent.
 */

export interface OtpInputHandle {
  /** Puts the caret back in the first box, e.g. after clearing a wrong code. */
  focusFirst: () => void;
}

interface OtpInputProps {
  value: string[];
  onChange: (digits: string[]) => void;
  /** Submits on the last digit's Enter, or wherever the parent wants it. */
  onEnter?: () => void;
  length?: number;
  disabled?: boolean;
  /** `md` matches the register page; `sm` fits inside a modal. */
  size?: "md" | "sm";
}

const SIZE_CLASSES = {
  md: "w-11 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl",
  sm: "w-10 h-12 sm:w-11 sm:h-14 text-lg sm:text-xl",
} as const;

const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(
  ({ value, onChange, onEnter, length = 6, disabled = false, size = "md" }, ref) => {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const focusInput = (index: number) => {
      inputRefs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
    };

    useImperativeHandle(ref, () => ({ focusFirst: () => focusInput(0) }));

    const handleChange = (index: number, raw: string) => {
      const digits = raw.replace(/\D/g, "");
      if (!digits) {
        onChange(value.map((d, i) => (i === index ? "" : d)));
        return;
      }

      const next = [...value];
      for (let i = 0; i < digits.length && index + i < length; i += 1) {
        next[index + i] = digits[i];
      }
      onChange(next);
      focusInput(index + digits.length);
    };

    const handleKeyDown = (
      index: number,
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Enter") {
        // Inside a modal there may be no surrounding form to submit this.
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        return;
      }
      if (event.key === "Backspace" && !value[index] && index > 0) {
        // Empty box: step back so a second backspace clears the previous digit.
        event.preventDefault();
        focusInput(index - 1);
        onChange(value.map((d, i) => (i === index - 1 ? "" : d)));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        focusInput(index - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        focusInput(index + 1);
      }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
      const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;
      event.preventDefault();
      const next = Array(length).fill("");
      for (let i = 0; i < Math.min(pasted.length, length); i += 1) {
        next[i] = pasted[i];
      }
      onChange(next);
      focusInput(Math.min(pasted.length, length - 1));
    };

    return (
      <div
        className="flex justify-center gap-2 sm:gap-3"
        onPaste={handlePaste}
      >
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={length}
            disabled={disabled}
            value={value[index] ?? ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${index + 1}`}
            className={`${SIZE_CLASSES[size]} text-center font-bold bg-white rounded-lg border border-gray-300 outline-none focus:border-orange-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400`}
          />
        ))}
      </div>
    );
  },
);

OtpInput.displayName = "OtpInput";

export default OtpInput;
