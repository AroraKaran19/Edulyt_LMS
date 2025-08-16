// app/LayoutWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/shared/Navbar/Navbar";
import Footer from "@/components/shared/Footer/Footer";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const CustomLayout =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/payment/status");

  return (
    <>
      <SessionProvider>
        {!CustomLayout && <Navbar />}
        <main
          className={cn(
            "flex min-h-screen flex-col pt-[78px] relative overflow-hidden",
            CustomLayout && "pt-0"
          )}
        >
          {children}
        </main>
        {!CustomLayout && <Footer />}
      </SessionProvider>
    </>
  );
}
