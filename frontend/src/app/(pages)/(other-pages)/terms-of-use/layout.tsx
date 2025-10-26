import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Terms of Use | Airkrit",
  description: "Terms of Use | Airkrit",
  keywords: ["Terms of Use", "Airkrit"],
  robots: "index, follow",
  icons: {
    icon: "https://www.airkrit.com/logo.png",
  },
  openGraph: {
    title: "Terms of Use | Airkrit",
    description: "Terms of Use | Airkrit",
    type: "website",
    url: "https://www.airkrit.com/terms-of-use",
    siteName: "Airkrit",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Use | Airkrit",
    description: "Terms of Use | Airkrit",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/terms-of-use"
      : "http://localhost:3000/terms-of-use"
  ),
};

const TermsOfUseLayout = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default TermsOfUseLayout;
