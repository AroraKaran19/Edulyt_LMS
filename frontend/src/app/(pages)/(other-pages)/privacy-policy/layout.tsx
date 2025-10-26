import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Privacy Policy | Airkrit",
  description: "Privacy Policy | Airkrit",
  keywords: [
    "Privacy Policy",
    "Airkrit",
    "Privacy Policy Page",
    "Privacy Policy Information",
    "Privacy Policy Details",
  ],
  robots: "index, follow",
  icons: {
    icon: "https://www.airkrit.com/logo.png",
  },
  openGraph: {
    title: "Privacy Policy | Airkrit",
    description: "Privacy Policy | Airkrit",
    type: "website",
    url: "https://www.airkrit.com/privacy-policy",
    siteName: "Airkrit",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Airkrit",
    description: "Privacy Policy | Airkrit",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
};

const PrivacyPolicyLayout = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default PrivacyPolicyLayout;
