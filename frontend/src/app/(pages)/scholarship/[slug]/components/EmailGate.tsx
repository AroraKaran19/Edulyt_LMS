"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Mail } from "lucide-react";
import { toast } from "react-toastify";
import scholarshipClient from "@/configs/scholarshipApiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

const OTP_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

type Props = {
  slug: string;
  /**
   * `phoneVerified` is always false for a code-verified session, but it is read
   * from the response rather than assumed so every entry path into the page
   * hands back the same shape.
   */
  onVerified: (token: string, phoneVerified: boolean) => void;
};

/**
 * Email then code, in one place with no navigation between them. Both steps
 * occupy the same slot so the change reads as progress rather than a new page.
 *
 * The mobile step that follows lives in `PhoneGate`, which the page renders
 * into this same slot. It is kept out of here because a signed-in candidate
 * skips the email gate entirely and can still owe a number.
 */
export default function EmailGate({ slug, onVerified }: Props) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") boxes.current[0]?.focus();
  }, [step]);

  const sendCode = async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      toast.error("Enter a valid email address");
      return;
    }
    setBusy(true);
    try {
      const res = await scholarshipClient.post(ENDPOINTS.scholarshipPublic.otp(slug), {
        email: clean,
      });
      setEmail(clean);
      setStep("code");
      setDigits(Array(OTP_LENGTH).fill(""));
      setCooldown(res.data?.data?.cooldownSeconds ?? 60);
      toast.success("Code sent, check your inbox");
    } catch (error) {
      toast.error(errorMessage(error, "Could not send the code"));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (code: string) => {
    setBusy(true);
    try {
      const res = await scholarshipClient.post(
        ENDPOINTS.scholarshipPublic.verifyOtp(slug),
        { email, otp: code },
      );
      onVerified(
        res.data?.data?.sessionToken,
        Boolean(res.data?.data?.phoneVerified),
      );
    } catch (error) {
      toast.error(errorMessage(error, "Could not verify that code"));
      setDigits(Array(OTP_LENGTH).fill(""));
      boxes.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (index: number, raw: string) => {
    // Pasting the whole code into any box fills the row, which is what people
    // actually do when the code is one tap away in another app.
    const only = raw.replace(/\D/g, "");
    if (only.length > 1) {
      const next = Array(OTP_LENGTH).fill("");
      only
        .slice(0, OTP_LENGTH)
        .split("")
        .forEach((d, i) => (next[i] = d));
      setDigits(next);
      if (next.every(Boolean)) void submitCode(next.join(""));
      else boxes.current[Math.min(only.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = only;
    setDigits(next);
    if (only && index < OTP_LENGTH - 1) boxes.current[index + 1]?.focus();
    if (next.every(Boolean)) void submitCode(next.join(""));
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      boxes.current[index - 1]?.focus();
    }
  };

  if (step === "email") {
    return (
      <div className="flex flex-col gap-3">
        <label
          htmlFor="sch-email"
          className="font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-gold"
        >
          Where your reward goes
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sch-on-ink-dim" />
          <input
            id="sch-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void sendCode()}
            className="w-full rounded-2xl border-[1.5px] border-sch-ink-line bg-sch-ink-raised py-3.5 pl-11 pr-4 text-base text-sch-on-ink placeholder:text-[#6d5f56] focus:border-sch-gold focus:outline-none"
          />
        </div>
        {/* Said before they type, not after they have lost the coupon. */}
        <p className="text-xs text-sch-on-ink-dim">
          The reward is locked to this address, so use one you can open.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void sendCode()}
          className="mt-1 w-full rounded-2xl bg-linear-to-br from-sch-foil to-[#f0763c] px-6 py-4 text-[0.9375rem] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? "Sending…" : "Send me a code"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setStep("email")}
        className="inline-flex items-center gap-1.5 self-start text-sm text-sch-on-ink-dim transition-colors hover:text-sch-gold"
      >
        <ChevronLeft className="h-4 w-4" />
        {email}
      </button>
      <span className="font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-gold">
        Six digits, in your inbox
      </span>
      <div className="grid grid-cols-6 gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            aria-label={`Digit ${i + 1}`}
            disabled={busy}
            className="aspect-3/4 max-h-15 w-full rounded-xl border-[1.5px] border-sch-ink-line bg-sch-ink-raised text-center font-sch-mono text-[1.375rem] text-sch-on-ink focus:border-sch-gold focus:outline-none disabled:opacity-60"
          />
        ))}
      </div>
      <button
        type="button"
        disabled={cooldown > 0 || busy}
        onClick={() => void sendCode()}
        className="self-start font-sch-mono text-xs tracking-wider text-sch-on-ink-dim transition-colors hover:text-sch-gold disabled:opacity-50 disabled:hover:text-sch-on-ink-dim"
      >
        {cooldown > 0 ? `RESEND IN ${cooldown}S` : "SEND A NEW CODE"}
      </button>
    </div>
  );
}
