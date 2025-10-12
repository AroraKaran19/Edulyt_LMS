import React, { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Metadata } from "next";
import AuthGuard from "@/components/shared/AuthGuard";
import { FullScreenLoader } from "@/components/ui";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cart | Airkrit India",
  description: "Cart page of Airkrit India.",
  keywords: ["cart", "airkrit"],
};

const CartLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense
      fallback={
        <FullScreenLoader
          text="Loading cart..."
          variant="spinner"
          size="lg"
        />
      }
    >
      <AuthGuard>
        <div
          className={`min-h-[calc(100dvh-78px)] w-full flex flex-col gap-10 p-4 bg-[rgba(226,226,226,0.4)] ${plusJakartaSans.className}`}
        >
          {children}
        </div>
      </AuthGuard>
    </Suspense>
  );
};

export default CartLayout;
