// app/LayoutWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/shared/Navbar/Navbar";
import Footer from "@/components/shared/Footer/Footer";
import { cn } from "@/lib/utils";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname.startsWith("/auth");

  return (
    <>
      {!isAdmin && !isAuth && <Navbar />}
      <main
        className={cn(
          "flex min-h-screen flex-col pt-[78px] relative overflow-hidden",
          (isAdmin || isAuth) && "pt-0"
        )}
      >
        {children}
      </main>
      {!isAdmin && !isAuth && <Footer />}
    </>
  );
}
