import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Privacy Policy | Airkrit India",
  description: "Privacy Policy | Airkrit India",
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
    title: "Privacy Policy | Airkrit India",
    description: "Privacy Policy | Airkrit India",
    type: "website",
    url: "https://www.airkrit.com/privacy-policy",
    siteName: "Airkrit India",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Airkrit India",
    description: "Privacy Policy | Airkrit India",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
};

const PrivacyPolicyLayout = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default PrivacyPolicyLayout;
