"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "react-toastify";
import type { ScholarshipResult } from "@/types/scholarship";

const istDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/**
 * The reveal. This is the first and only place the discount is named, on the
 * page and in the API both.
 *
 * The percentage is the hero and the code sits under it, because the number is
 * what they won and the code is only how they spend it. The score closes the
 * page as a small win, never as a note that it changed nothing.
 */
export default function ResultCard({ result }: { result: ScholarshipResult }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await writeToClipboard(result.couponCode);
    if (!ok) {
      toast.error("Could not copy the code");
      return;
    }
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 1600);
  };

  if (result.expired) {
    return (
      <div className="flex animate-sch-rise flex-col gap-4 motion-reduce:animate-none">
        <span className="font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-gold-deep">
          Expired
        </span>
        <h1 className="font-sch-display text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
          This code ran out of time.
        </h1>
        {/* The date and the reason both appear: "expired" on its own reads as a
            bug to someone who was told they had weeks. */}
        <p className="text-[0.9375rem] leading-relaxed text-sch-on-paper-dim">
          Your {result.discountPercent}% code expired on{" "}
          {istDate(result.couponExpiresAt)}. It was valid for a set number of
          days after you finished the test.
        </p>
        <code className="rounded-xl bg-sch-on-paper/5 px-4 py-3 text-center font-sch-mono text-lg tracking-[0.15em] text-sch-on-paper-dim line-through">
          {result.couponCode}
        </code>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="animate-sch-rise motion-reduce:animate-none">
        <span className="font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-gold-deep">
          Yours to keep
        </span>
        <h1 className="mt-2 font-sch-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.96] tracking-[-0.03em]">
          You earned it.
        </h1>
      </div>

      {/* The number is the hero. Everything else on this screen is quieter than
          it, which is the whole point of having held it back. */}
      <div className="animate-sch-rise rounded-2xl border border-sch-on-paper/8 bg-white px-6 py-8 text-center shadow-[0_18px_48px_-24px_rgba(201,123,29,0.55)] [animation-delay:140ms] motion-reduce:animate-none">
        <div className="flex items-baseline justify-center gap-1">
          <span className="font-sch-display text-[clamp(4rem,22vw,7rem)] font-semibold leading-[0.85] tracking-[-0.03em] text-sch-foil">
            {result.discountPercent}
          </span>
          <span className="font-sch-display text-[clamp(1.75rem,8vw,2.75rem)] font-semibold text-sch-foil">
            %
          </span>
        </div>
        <p className="mt-2 font-sch-mono text-sm font-medium uppercase tracking-[0.18em] text-sch-on-paper-dim">
          off any course
        </p>

        <div className="mt-7 border-t border-dashed border-sch-on-paper/16 pt-6">
          <p className="mb-2 text-xs text-sch-on-paper-dim">Your code</p>
          <code className="block select-all break-all font-sch-mono text-xl font-semibold tracking-[0.18em] sm:text-2xl">
            {result.couponCode}
          </code>
          <button
            type="button"
            onClick={() => void copy()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-sch-foil to-[#f0763c] px-6 py-4 text-[0.9375rem] font-semibold text-white transition hover:brightness-110"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy code
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex animate-sch-rise flex-col gap-4 [animation-delay:280ms] motion-reduce:animate-none">
        <p className="text-[0.9375rem] leading-relaxed text-sch-on-paper-dim">
          Use it on any course at checkout. Valid until{" "}
          <strong className="text-sch-on-paper">
            {istDate(result.couponExpiresAt)}
          </strong>
          .
        </p>

        {/* The recovery route, stated as an instruction rather than as an
            admission that nothing was emailed: a limitation notice at the
            moment someone has just won reads as a catch. */}
        <div className="rounded-xl border border-sch-foil/20 bg-sch-foil/7 px-4 py-3.5">
          <p className="text-sm leading-relaxed text-sch-on-paper">
            <strong>Save this code now.</strong> If you lose it, open this page
            again and enter the same email address.
          </p>
        </div>

        {/* The score is a small win to end on. Telling them here that it
            changed nothing would deflate the exact moment the whole page is
            built around. */}
        <p className="font-sch-mono text-xs text-sch-on-paper-dim">
          You answered {result.correctCount} of {result.totalQuestions}{" "}
          correctly.
        </p>
      </div>
    </div>
  );
}
