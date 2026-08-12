"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import JoinButton from "./JoinButton";
import { PLANS, type PlanId } from "./plans";

type Props = {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
  onCompare: () => void;
};

type Errors = Partial<Record<"name" | "email" | "phone" | "form", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LeadForm({ selected, onSelect, onCompare }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name";
    if (!EMAIL.test(email.trim())) next.email = "Enter a valid email address";
    if (!/^[6-9]\d{9}$/.test(phone)) next.phone = "Enter a 10-digit mobile number";
    return next;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      const response = await fetch("/api/join-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone,
          plan: selected,
          source: typeof window !== "undefined" ? window.location.search : "",
        }),
      });
      if (!response.ok) throw new Error("Request failed");
      setSent(true);
    } catch {
      setErrors({ form: "That did not go through. Try once more." });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    const plan = PLANS.find((p) => p.id === selected)!;
    return (
      <div className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]" id="jo-form">
        <div className="px-[26px] pt-10 pb-[34px] text-center">
          <div className="mx-auto mb-[18px] grid size-14 place-items-center rounded-full bg-[#3aa544]/[0.12] text-[#3aa544]">
            <Check size={26} strokeWidth={3} />
          </div>
          <h2 className="mb-2.5 text-2xl font-extrabold tracking-[-0.02em] text-text-primary">
            We have your details
          </h2>
          <p className="mx-auto max-w-[36ch] text-[0.9375rem] leading-[1.6] text-text-secondary">
            You picked the {plan.name} plan. A counsellor will call you on +91{" "}
            {phone} within one working day.
          </p>
          <ul className="mt-6 grid gap-3 border-t border-[#fbe3d2] pt-5 text-left text-sm leading-[1.5] text-text-secondary">
            <li>
              <b className="text-[#c4551a]">Now:</b> plan breakdown and fees land
              in your inbox at {email}.
            </li>
            <li>
              <b className="text-[#c4551a]">Within a day:</b> a call to confirm
              your batch and start date.
            </li>
            <li>
              <b className="text-[#c4551a]">After that:</b> your login, and all 36
              courses open up.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]" id="jo-form">
      <form
        className="px-[22px] pt-[26px] pb-6 sm:px-7 sm:pt-[30px] sm:pb-[26px]"
        onSubmit={submit}
        noValidate
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#c4551a]">
            Enrolment enquiry
          </span>
          <span className="text-xs font-semibold text-[#8c7a70]">
            Takes 30 seconds
          </span>
        </div>

        <h2 className="mt-4 mb-1.5 text-[1.6rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-text-primary">
          Get your plan details
        </h2>
        <p className="mb-5 text-sm leading-[1.55] text-text-secondary">
          Tell us where to send the plan breakdown, the fee structure and your
          batch dates.
        </p>

        <div className="mb-[15px]">
          <label className="block text-[12.5px] font-bold text-text-primary mb-[7px]" htmlFor="jo-name">
            Full name
          </label>
          <input
            id="jo-name"
            className="h-12 w-full rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] px-3.5 text-[15px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#b7a79b] hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
            type="text"
            autoComplete="name"
            placeholder="Ananya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.name}</span>}
        </div>

        <div className="mb-[15px]">
          <label className="block text-[12.5px] font-bold text-text-primary mb-[7px]" htmlFor="jo-email">
            Email
          </label>
          <input
            id="jo-email"
            className="h-12 w-full rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] px-3.5 text-[15px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#b7a79b] hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.email}</span>}
        </div>

        <div className="mb-[15px]">
          <label className="block text-[12.5px] font-bold text-text-primary mb-[7px]" htmlFor="jo-phone">
            Mobile number
          </label>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-12 flex-none items-center rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fbf3ed] px-[13px] text-[15px] font-semibold text-text-secondary">
              +91
            </span>
            <input
              id="jo-phone"
              className="h-12 w-full rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] px-3.5 text-[15px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#b7a79b] hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              aria-invalid={!!errors.phone}
            />
          </div>
          {errors.phone && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.phone}</span>}
        </div>

        <div className="mb-[15px]">
          <div className="mb-[9px] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
            <span className="block text-[12.5px] font-bold text-text-primary">Plan you are interested in</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-bold text-[#c4551a] underline decoration-[#c4551a]/40 decoration-[1.5px] underline-offset-[3px] hover:text-primary hover:decoration-current focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary"
              onClick={onCompare}
            >
              Compare plans
              <ArrowDown size={13} strokeWidth={2.6} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((plan) => (
              <label
                key={plan.id}
                className={cn(
                  "relative block cursor-pointer rounded-xl border-[1.5px] px-2 py-3.5 text-center transition-[border-color,background-color,box-shadow] duration-150",
                  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                  selected === plan.id
                    ? "border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(247,173,36,0.24)]"
                    : "border-[#ecdfd5] bg-[#fffcfa] hover:border-[#f2d6c2]"
                )}
              >
                <input
                  type="radio"
                  name="plan-form"
                  value={plan.id}
                  checked={selected === plan.id}
                  onChange={() => onSelect(plan.id)}
                  className="sr-only"
                />
                <span className="block text-[14.5px] font-extrabold leading-[1.2] text-text-primary">
                  {plan.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {errors.form && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.form}</span>}

        <JoinButton type="submit" block disabled={sending}>
          {sending ? "Sending" : "Send me the details"}
          {!sending && <ArrowRight size={15} strokeWidth={2.5} />}
        </JoinButton>

        <p className="mt-3.5 text-[11.5px] leading-[1.55] text-[#8c7a70]">
          By submitting you agree to hear from Airkrit about this plan over
          email, SMS and WhatsApp. Read our{" "}
          <Link
            href="/terms-of-use"
            className="text-text-secondary underline underline-offset-2"
          >
            terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="text-text-secondary underline underline-offset-2"
          >
            privacy policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
