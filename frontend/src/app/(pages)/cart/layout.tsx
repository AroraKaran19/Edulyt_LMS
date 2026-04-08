import React from "react";
import AuthGuard from "@/app/providers/AuthGuard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart | Airkrit India",
  description: "Cart | Airkrit India",
  keywords: ["Cart", "Airkrit", "Cart | Airkrit"],
  openGraph: {
    title: "Cart | Airkrit India",
    description: "Cart | Airkrit India",
    type: "website",
    url: "https://www.airkrit.com/cart",
    siteName: "Airkrit India",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cart | Airkrit India",
    description: "Cart | Airkrit India",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const CartLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard requiredUserType={["student"]} fallbackPath="/login">
      {children}
    </AuthGuard>
  );
};

export default CartLayout;
