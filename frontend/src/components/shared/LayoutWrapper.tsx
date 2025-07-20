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
  const CustomLayout = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/auth");

  return (
    <>
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
    </>
  );
}
