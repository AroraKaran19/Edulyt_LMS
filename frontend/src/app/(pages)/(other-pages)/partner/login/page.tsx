"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Dancing_Script } from "next/font/google";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import { cn } from "@/lib/utils";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const HERO_IMAGE = "/partner/partner-login.png";

const SCROLLBAR_HIDE =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
    >
      <path fill="#F35325" d="M1 1h10.5v10.5H1z" />
      <path fill="#81BC06" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#05A6F0" d="M1 12.5h10.5V23H1z" />
      <path fill="#FFBA08" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  );
}

export default function PartnerLoginPage() {
  const router = useRouter();
  const [partnerKind, setPartnerKind] = useState<"college" | "institute">(
    "college"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function goToDashboard() {
    router.push(`/partner/${partnerKind}/dashboard`);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      goToDashboard();
    }, 300);
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#fffcfa] lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      <div className="flex flex-1 flex-col justify-center px-3 py-4 sm:px-5 sm:py-6 lg:min-h-0 lg:flex-1 lg:justify-stretch lg:overflow-hidden lg:p-4">
        <div
          className={cn(
            "mx-auto flex w-full flex-col lg:h-full lg:min-h-0 lg:max-h-full lg:flex-row lg:gap-8"
          )}
        >
          <section
            className={cn(
              "relative hidden w-full shrink-0 overflow-hidden rounded-3xl",
              "lg:block lg:h-full lg:w-1/2"
            )}
          >
            <Image
              src={HERO_IMAGE}
              alt="Business partners joining hands in collaboration"
              fill
              priority
              className="rounded-3xl object-cover"
            />
            <div
              className="absolute inset-0 rounded-3xl bg-linear-to-b from-[#F27420]/75 via-[#F27420]/60 to-black/65"
              aria-hidden
            />
            <div className="relative z-10 flex h-full min-h-0 flex-col justify-end gap-3 p-6 sm:p-8 lg:p-16">
              <p
                className={cn(
                  dancingScript.className,
                  "text-xl leading-snug text-white sm:text-3xl"
                )}
              >
                Trusted by 500+ Academic Partners
              </p>
              <h1 className="text-2xl font-medium leading-tight text-white sm:text-6xl">
                Empowering Institutes &amp; Colleges
              </h1>
              <p className="text-sm leading-relaxed text-white/95 sm:text-[18px]">
                Our platform collaborates with colleges and institutes to help
                students gain practical skills, internships, and better career
                opportunities.
              </p>
            </div>
          </section>

          <section
            className={cn(
              "flex w-full flex-col gap-0 rounded-3xl bg-[#fffcfa] px-4 py-6 sm:px-8 sm:py-8",
              "lg:h-full lg:min-h-0 lg:w-1/2 lg:justify-center lg:overflow-y-auto lg:overscroll-y-contain lg:px-4 lg:py-0",
              SCROLLBAR_HIDE
            )}
          >
            <header className="mb-3 sm:mb-4">
              <Image
                src="/logo.svg"
                alt="Edulyt"
                width={160}
                height={160}
                className="h-auto w-[120px] sm:w-[140px] md:w-[200px]"
              />
            </header>

            <h2 className="text-xl font-bold leading-tight text-neutral-800 sm:text-2xl sm:text-[1.75rem]">
              Welcome Back Partners !
            </h2>
            <p className="mt-2 text-sm leading-snug text-neutral-600 sm:text-[15px]">
              Access your dashboard to manage students, programs, and
              collaborations.
            </p>

            <p className="mt-6 text-sm font-semibold text-neutral-800">
              Login as Partner
            </p>
            <div className="mt-2 flex rounded-full border-2 border-[#F27420]">
              <button
                type="button"
                onClick={() => setPartnerKind("college")}
                className={cn(
                  "flex-1 cursor-pointer rounded-l-full py-2.5 text-sm font-medium transition-colors",
                  partnerKind === "college"
                    ? "bg-[#FFF4ED] text-[#F27420] border-r-2 border-[#F27420]"
                    : "bg-white text-neutral-600"
                )}
              >
                College Partners
              </button>
              <button
                type="button"
                onClick={() => setPartnerKind("institute")}
                className={cn(
                  "flex-1 cursor-pointer rounded-r-full py-2.5 text-sm font-semibold transition-colors",
                  partnerKind === "institute"
                    ? "bg-[#FFF4ED] text-[#F27420] border-l-2 border-[#F27420]"
                    : "bg-white text-neutral-600"
                )}
              >
                Institutes Partners
              </button>
            </div>

            <form
              className="mt-6 flex flex-col gap-5"
              onSubmit={handleSubmit}
            >
              <Input
                label="Email"
                labelClassName="text-[#666]! font-medium! text-sm mb-1.5"
                type="email"
                required
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startAdornment={
                  <Mail className="size-[18px] shrink-0 text-[#667085]" />
                }
                className="text-sm!"
                suppressHydrationWarning
              />

              <Input
                label="Password"
                labelClassName="text-[#666]! font-medium! text-sm mb-1.5"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startAdornment={
                  <Lock className="size-[18px] shrink-0 text-[#667085]" />
                }
                endAdornment={
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer text-[#667085] transition-colors hover:text-[#475467]"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-[18px]" />
                    ) : (
                      <Eye className="size-[18px]" />
                    )}
                  </button>
                }
                className="text-sm!"
                suppressHydrationWarning
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#475467]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border-[#D0D5DD] accent-[#F27420]"
                  />
                  Remember
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-[#0080f6] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <OrangeButton
                type="submit"
                glow={false}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Logging in..." : "Login"}
              </OrangeButton>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
