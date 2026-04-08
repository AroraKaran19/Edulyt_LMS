import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Security Policy | Airkrit India",
  description: "Security Policy | Airkrit India",
  keywords: [
    "Security Policy",
    "Airkrit India",
    "Security Policy Page",
    "Security Policy Information",
    "Security Policy Details",
  ],
  robots: "index, follow",
  icons: {
    icon: "https://www.airkrit.com/logo.png",
  },
  openGraph: {
    title: "Security Policy | Airkrit India",
    description: "Security Policy | Airkrit India",
    type: "website",
    url: "https://www.airkrit.com/security-policy",
    siteName: "Airkrit India",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Security Policy | Airkrit India",
    description: "Security Policy | Airkrit India",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/security-policy"
      : "http://localhost:3000/security-policy"
  ),
};

const SecurityPolicyLayout = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default SecurityPolicyLayout;
