"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";
import { signInWithOAuthProvider } from "@/lib/oauthSignInClient";
import EnquiryButton from "./EnquiryButton";
import {
  CAREER_STAGES,
  ISSUERS,
  MNC_ADDON_PRICE,
  PLANS,
  type PlanId,
} from "./plans";

type Props = {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
  /** Chosen MNC certification, null if none. Free on Mentor-to-Placement. */
  cert: string | null;
  onCert: (cert: string | null) => void;
  onCompare: () => void;
  /** Career stage carried back through the Google round trip, if any. */
  initialStage?: string;
};

type Errors = Partial<
  Record<"name" | "email" | "phone" | "stage" | "form", string>
>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LeadForm({
  selected,
  onSelect,
  cert,
  onCert,
  onCompare,
  initialStage = "",
}: Props) {
  const { user, isAuthenticated } = useAuth();

  /*
   * Signed-in students get their profile as the default for each field, but
   * anything they type wins. Holding the inputs as null-until-touched keeps
   * that a derived value, so the profile can land after hydration without an
   * effect writing state back into the form.
   */
  const profile = isAuthenticated ? user : undefined;
  const profileName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const profilePhone = (profile?.phone ?? "").replace(/\D/g, "").slice(-10);

  const [nameInput, setNameInput] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string | null>(null);
  const [stage, setStage] = useState(initialStage);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const name = nameInput ?? profileName;
  const email = emailInput ?? profile?.email ?? "";
  const phone = phoneInput ?? profilePhone;

  const setName = setNameInput;
  const setEmail = setEmailInput;
  const setPhone = setPhoneInput;

  /** Google returns the student here with their picks intact. */
  const handleGoogle = async () => {
    setOauthLoading(true);
    const back = new URLSearchParams({ plan: String(selected) });
    if (cert) back.set("cert", cert);
    if (stage) back.set("stage", stage);

    try {
      const out = await signInWithOAuthProvider(
        "google",
        `/enquiry?${back.toString()}`
      );
      if (out.kind === "redirect_to_provider") {
        window.location.assign(out.url);
        return;
      }
      if (out.kind === "oauth_redirecting") return;
      if (out.kind === "success") {
        window.location.assign(out.dest);
        return;
      }
      setErrors({ form: out.message || "Could not sign in with Google." });
    } catch {
      setErrors({ form: "Could not sign in with Google. Try again." });
    }
    setOauthLoading(false);
  };

  const chosenPlan = PLANS.find((p) => p.id === selected)!;
  const freeCert = selected === 3;
  const addonCost = cert && !freeCert ? MNC_ADDON_PRICE : 0;
  const total = chosenPlan.price + addonCost;

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name";
    if (!EMAIL.test(email.trim())) next.email = "Enter a valid email address";
    if (phone.length !== 10) {
      next.phone = "Enter a 10-digit mobile number";
    } else if (!/^[6-9]/.test(phone)) {
      next.phone = "Indian mobile numbers start with 6, 7, 8 or 9";
    }
    if (!stage) next.stage = "Pick where you are right now";
    return next;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      const response = await fetch("/api/enquiry-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone,
          careerStage: stage,
          userId: profile?._id,
          plan: selected,
          certification: cert,
          total,
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
      <div className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]" id="eq-form">
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
    <div className="rounded-2xl border border-[#fbe3d2] bg-white shadow-[0_10px_30px_-14px_rgba(43,21,8,0.18),0_2px_6px_rgba(43,21,8,0.04)]" id="eq-form">
      <form
        className="px-[18px] pt-4 pb-[18px] sm:px-6 sm:pt-5 sm:pb-5"
        onSubmit={submit}
        noValidate
      >
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[1.15rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-text-primary">
            Get your plan details
          </h2>
          <span className="flex-none text-[11px] font-semibold whitespace-nowrap text-[#8c7a70]">
            Takes 30 seconds
          </span>
        </div>

        {isAuthenticated ? (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#3aa544]/[0.08] px-3 py-2">
            <Check size={13} strokeWidth={3.4} className="flex-none text-[#2c7f34]" />
            <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-[#2c7f34]">
              Signed in as {profileName || profile?.email}
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={oauthLoading}
              className="mb-2.5 flex h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#ecdfd5] bg-white text-[13.5px] font-bold text-text-primary transition-[border-color,background-color] duration-150 hover:border-[#f2d6c2] hover:bg-[#fffaf6] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Image src="/google-icon.svg" alt="" width={16} height={16} />
              {oauthLoading ? "Opening Google..." : "Continue with Google"}
            </button>
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="h-px flex-1 bg-[#f2d6c2]" />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8c7a70]">
                or fill it in
              </span>
              <span className="h-px flex-1 bg-[#f2d6c2]" />
            </div>
          </>
        )}

        <div className="mb-2.5">
          <label className="block text-[11.5px] font-bold text-text-primary mb-1" htmlFor="eq-name">
            Full name
          </label>
          <input
            id="eq-name"
            className="h-[42px] w-full rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] px-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#b7a79b] hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
            type="text"
            autoComplete="name"
            placeholder="Ananya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.name}</span>}
        </div>

        <div className="mb-2.5">
          <label className="block text-[11.5px] font-bold text-text-primary mb-1" htmlFor="eq-email">
            Email
          </label>
          <input
            id="eq-email"
            className="h-[42px] w-full rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] px-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#b7a79b] hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
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

        <div className="mb-2.5">
          <label className="block text-[11.5px] font-bold text-text-primary mb-1" htmlFor="eq-phone">
            Mobile number
          </label>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-[42px] flex-none items-center rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fbf3ed] px-3 text-[14px] font-semibold text-text-secondary">
              +91
            </span>
            <input
              id="eq-phone"
              className="h-[42px] w-full rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] px-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#b7a79b] hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
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

        <div className="mb-2.5">
          <label className="block text-[11.5px] font-bold text-text-primary mb-1" htmlFor="eq-stage">
            Career stage
          </label>
          <div className="relative">
            <select
              id="eq-stage"
              className="h-[42px] w-full appearance-none rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] pr-9 pl-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)] aria-invalid:border-[#d2451e]"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              aria-invalid={!!errors.stage}
            >
              <option value="" disabled>
                Where are you right now?
              </option>
              {CAREER_STAGES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              strokeWidth={2.6}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#8c7a70]"
            />
          </div>
          {errors.stage && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.stage}</span>}
        </div>

        <div className="mb-2.5">
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
          <div className="grid grid-cols-3 gap-1.5">
            {PLANS.map((plan) => (
              <label
                key={plan.id}
                className={cn(
                  "relative block cursor-pointer rounded-lg border-[1.5px] px-1.5 py-2 text-center transition-[border-color,background-color,box-shadow] duration-150",
                  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                  selected === plan.id
                    ? "border-primary bg-primary/10 shadow-[0_0_0_3px_rgba(247,173,36,0.22)]"
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
                <span className="block truncate text-[11.5px] font-bold text-text-primary">
                  {plan.name}
                </span>
                <span className="mt-0.5 block text-[12.5px] font-extrabold text-primary">
                  ₹{plan.price.toLocaleString("en-IN")}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-2.5">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <label
                className="block text-[11.5px] font-bold text-text-primary"
                htmlFor="eq-cert"
              >
                MNC certification
              </label>
              <span className="flex-none text-[10.5px] font-bold whitespace-nowrap text-[#c4551a]">
                {freeCert ? "1 included free" : `+₹${MNC_ADDON_PRICE.toLocaleString("en-IN")} each`}
              </span>
            </div>
            <div className="relative">
              <select
                id="eq-cert"
                className="h-[42px] w-full appearance-none rounded-xl border-[1.5px] border-[#ecdfd5] bg-[#fffcfa] pr-9 pl-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-[#f2d6c2] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3.5px_rgba(247,173,36,0.28)]"
                value={cert ?? ""}
                onChange={(e) => onCert(e.target.value || null)}
              >
                <option value="">
                  {freeCert ? "Help me choose later" : "No certification"}
                </option>
                {ISSUERS.map((issuer) => (
                  <option key={issuer.name} value={issuer.name}>
                    {issuer.name}
                    {freeCert
                      ? " (free)"
                      : ` (+₹${MNC_ADDON_PRICE.toLocaleString("en-IN")})`}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                strokeWidth={2.6}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#8c7a70]"
              />
            </div>
            <p className="mt-1 text-[10.5px] leading-[1.45] text-[#8c7a70]">
              {freeCert
                ? "Mentor-to-Placement includes one certification of your choice at no extra cost."
                : "Optional. Sit the official exam and get certified by Meta, Microsoft, Adobe or Cisco."}
            </p>
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2 rounded-lg bg-[#fff6f1] px-3 py-2">
            <span className="text-[11px] leading-[1.35] font-semibold text-text-secondary">
              {cert
                ? addonCost > 0
                  ? `${chosenPlan.name} + ${cert} certification`
                  : `${chosenPlan.name}, ${cert} certification included`
                : `${chosenPlan.name}, no certification added`}
            </span>
            <span className="flex-none text-[14px] font-extrabold text-primary">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {errors.form && <span className="mt-1.5 block text-xs font-semibold text-[#c03c19]">{errors.form}</span>}

        <EnquiryButton type="submit" block disabled={sending}>
          {sending ? "Sending" : "Send me the details"}
          {!sending && <ArrowRight size={15} strokeWidth={2.5} />}
        </EnquiryButton>

        <p className="mt-2.5 text-[10.5px] leading-[1.45] text-[#8c7a70]">
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
