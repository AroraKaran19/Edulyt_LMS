"use client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/Navbar/Navbar";
import Footer from "@/components/shared/Footer/Footer";
import { useEffect, useState } from "react";
import { FullScreenLoader } from "@/components/ui/Loader";
import { SessionProvider } from "next-auth/react";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const visibleLayout =
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/instructor") &&
    !pathname.startsWith("/partner") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/register") &&
    !pathname.startsWith("/payment/status") &&
    !pathname.startsWith("/forgot-password");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isHomePage = pathname === "/";
  const isPartnerArea = pathname.startsWith("/partner");
  const isPartnerAuthPage =
    pathname === "/partner" || pathname.startsWith("/partner/login");

  // Skip the full-screen loader on the homepage so it renders immediately.
  if (!isMounted && !isHomePage) {
    return <FullScreenLoader text="Loading..." size="lg" variant="spinner" />;
  }

  return (
    <SessionProvider>
      {visibleLayout && <Navbar />}
      <main
        className={cn(
          "flex flex-col relative",
          visibleLayout && "min-h-screen pt-[78px]",
          !visibleLayout && !isPartnerArea && "min-h-screen pt-0",
          isPartnerArea && isPartnerAuthPage && "min-h-screen pt-0",
          isPartnerArea &&
            !isPartnerAuthPage &&
            "h-dvh min-h-0 max-h-dvh overflow-hidden pt-0"
        )}
      >
        {children}
      </main>
      {visibleLayout && <Footer />}
    </SessionProvider>
  );
}
