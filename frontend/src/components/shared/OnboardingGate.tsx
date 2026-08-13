"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import apiClient from "@/configs/apiConfig";
import useAuth from "@/hooks/useAuth";
import { Student } from "@/types";
import { FullScreenLoader } from "@/components/ui/Loader";

const EXCLUDED_PREFIXES = [
  "/onboarding",
  "/login",
  "/register",
  "/forgot-password",
  "/admin",
  "/instructor",
  "/partner",
  "/auth-redirect",
  "/payment/status",
  "/enquiry",
];

const isExcluded = (pathname: string) =>
  EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`),
  );

const OnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname() || "/";
  const router = useRouter();

  // Caches keyed by userId so we only block/redirect-decide once per session.
  const verifiedUserId = useRef<string | null>(null); // confirmed complete
  const failedOpenUserId = useRef<string | null>(null); // API failed → let through
  const inFlight = useRef(false);
  // Bump to force a re-render after a ref-cached verdict changes.
  const [, setTick] = useState(0);

  const userId = user?._id ?? (isAuthenticated ? "self" : null);
  const gateApplies =
    isAuthenticated && user?.userType === "student" && !isExcluded(pathname);
  const decided =
    userId != null &&
    (verifiedUserId.current === userId || failedOpenUserId.current === userId);
  const needsCheck = gateApplies && !decided;

  useEffect(() => {
    if (!needsCheck || inFlight.current) return;
    inFlight.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/users/me");
        const profile = res.data?.data as Student | undefined;
        if (cancelled) return;

        const complete =
          Boolean(profile?.phone?.trim()) &&
          Boolean(profile?.experienceLevel?.trim()) &&
          Boolean(profile?.degreeName?.trim());

        if (complete) {
          if (userId) verifiedUserId.current = userId;
          setTick((t) => t + 1); // re-render → unblock children
        } else {
          router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
        }
      } catch {
        if (!cancelled && userId) {
          failedOpenUserId.current = userId;
          setTick((t) => t + 1);
        }
      } finally {
        inFlight.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsCheck, userId, pathname, router]);

  if (needsCheck) {
    return <FullScreenLoader text="Loading..." size="lg" variant="spinner" />;
  }

  return <>{children}</>;
};

export default OnboardingGate;
