"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FullScreenLoader } from "@/components/ui";

const AuthCallbackPage = () => {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleAuthCallback = async () => {
      if (status === "authenticated" && session?.user) {
        // Check if this is a first-time login
        const user = session.user as any;
        if (user?.isFirstTime) {
          router.push("/profile/settings");
        } else {
          router.push("/dashboard");
        }
      } else if (status === "unauthenticated") {
        router.push("/auth/login");
      }
    };

    handleAuthCallback();
  }, [status, session, router, isClient]);

  // Show loading while checking authentication status
  if (!isClient || status === "loading") {
    return (
      <FullScreenLoader
        text="Completing sign in..."
        size="lg"
        variant="spinner"
      />
    );
  }

  // This should not be reached as the useEffect handles redirects
  return (
    <FullScreenLoader
      text="Redirecting..."
      size="lg"
      variant="spinner"
    />
  );
};

export default AuthCallbackPage;
