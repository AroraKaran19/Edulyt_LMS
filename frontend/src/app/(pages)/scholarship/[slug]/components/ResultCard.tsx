"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

/** Seconds on screen before the enquiry form is opened for them. */
const REDIRECT_SECONDS = 5;

export default function ResultCard({ email }: { email: string }) {
  const router = useRouter();
  const next = `/enquiry?email=${encodeURIComponent(email)}`;
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      router.push(next);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, router, next]);

  return (
    <div className="flex flex-col gap-7">
      <div className="animate-sch-rise motion-reduce:animate-none">
        <span className="font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-gold-deep">
          All done
        </span>
        <h1 className="mt-2 font-sch-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.96] tracking-[-0.03em]">
          You earned it.
        </h1>
      </div>

      <div className="animate-sch-rise rounded-2xl border border-sch-on-paper/8 bg-white px-6 py-8 text-center shadow-[0_18px_48px_-24px_rgba(201,123,29,0.55)] [animation-delay:140ms] motion-reduce:animate-none">
        <Mail className="mx-auto h-9 w-9 text-sch-foil" strokeWidth={1.5} />
        <p className="mt-5 font-sch-display text-[1.375rem] font-semibold leading-tight">
          Your discount is on its way
        </p>
        {/* The address is repeated back: it was typed minutes ago and nothing
            since has confirmed which one the code went to. */}
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-sch-on-paper-dim">
          We have emailed your code to{" "}
          <strong className="break-all text-sch-on-paper">{email}</strong>. It
          names your discount and how long you have to use it.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-sch-on-paper-dim">
          Nothing arrived? Check your spam folder before writing to us.
        </p>
      </div>

      <div className="flex animate-sch-rise flex-col gap-4 [animation-delay:280ms] motion-reduce:animate-none">
        <button
          type="button"
          onClick={() => router.push(next)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-sch-foil to-[#f0763c] px-6 py-4 text-[0.9375rem] font-semibold text-white transition hover:brightness-110"
        >
          See course plans
        </button>
        <p
          aria-live="polite"
          className="text-center text-sm text-sch-on-paper-dim"
        >
          Taking you there in {seconds}s
        </p>
      </div>
    </div>
  );
}
