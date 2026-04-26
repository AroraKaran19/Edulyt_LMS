"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { awaitClientSessionAfterSignIn } from "@/lib/awaitClientSession";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import type { User } from "@/types/user";

function AuthRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await awaitClientSessionAfterSignIn(10, 150);
      if (cancelled) return;
      if (session?.user) {
        const dest = getPostLoginRedirectPath(session.user as User, next);
        router.replace(dest);
        return;
      }
      router.replace("/login");
    })();
    return () => {
      cancelled = true;
    };
  }, [router, next]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#F3F3F3]">
      <div className="flex flex-col items-center gap-3 text-gray-600">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-[#F3F3F3]">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      }
    >
      <AuthRedirectInner />
    </Suspense>
  );
}
