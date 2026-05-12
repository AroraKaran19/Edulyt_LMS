"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Dancing_Script } from "next/font/google";
import { Eye, EyeOff, Loader2, Lock, Mail, X } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "react-toastify";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Input from "@/components/ui/inputs/Input";
import { awaitClientSessionAfterSignIn } from "@/lib/awaitClientSession";
import { showLoginErrorToast } from "@/lib/showLoginErrorToast";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import type { User } from "@/types/user";
import { cn } from "@/lib/utils";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const HERO_IMAGE = "/partner/partner-login.png";
const PARTNER_DASHBOARD = "/partner/college/dashboard";

const SCROLLBAR_HIDE =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

export default function PartnerLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // If someone is already logged in, send them where they belong instead of
  // showing the partner login form. Partners → their dashboard; admins /
  // instructors / students → their own role home.
  useEffect(() => {
    if (status !== "authenticated") return;
    const u = session?.user as User | undefined;
    if (!u) return;
    if (u.userType === "partner") {
      router.replace(PARTNER_DASHBOARD);
      return;
    }
    router.replace(getPostLoginRedirectPath(u, null));
  }, [status, session, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-[#fffcfa]">
        <Loader2 className="size-10 animate-spin text-[#F27420]" />
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        portal: "partner",
        redirect: false,
        callbackUrl: PARTNER_DASHBOARD,
      });

      if (result?.error) {
        showLoginErrorToast(result.error);
        return;
      }
      if (!result?.ok) {
        toast.error("Login failed. Please try again.");
        return;
      }

      // Confirm the session is hydrated before routing — otherwise the dashboard
      // loads with stale "logged out" state on the first paint.
      await awaitClientSessionAfterSignIn();
      router.push(PARTNER_DASHBOARD);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
                Trusted by 500+ College Partners
              </p>
              <h1 className="text-2xl font-medium leading-tight text-white sm:text-6xl">
                Empowering Colleges
              </h1>
              <p className="text-sm leading-relaxed text-white/95 sm:text-[18px]">
                Our platform collaborates with colleges to help their students
                gain practical skills, internships, and better career
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
              Welcome Back, College Partner!
            </h2>
            <p className="mt-2 text-sm leading-snug text-neutral-600 sm:text-[15px]">
              Access your dashboard to view your students and manage your
              college profile.
            </p>

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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="cursor-pointer text-sm font-semibold text-[#0080f6] hover:underline"
                >
                  Forgot password?
                </button>
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

      {showForgotPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowForgotPasswordModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                Forgot password?
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                aria-label="Close"
                className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-relaxed text-gray-600">
                Partner accounts can&apos;t reset their own password. Please
                reach out to the Airkrit admin team and they&apos;ll issue you
                a new one.
              </p>
            </div>
            <div className="flex justify-end border-t border-gray-100 px-5 py-3">
              <OrangeButton
                glow={false}
                onClick={() => setShowForgotPasswordModal(false)}
              >
                Got it
              </OrangeButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
