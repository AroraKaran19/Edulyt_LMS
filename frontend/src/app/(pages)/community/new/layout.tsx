import { Metadata } from "next";
import React from "react";
import AuthGuard from "@/app/providers/AuthGuard";

export const metadata: Metadata = {
  title: "Contact | Airkrit India",
  description:
    "Get in touch with Airkrit. We're updating this page — check back soon.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/contact"
      : "http://localhost:3000/contact",
  ),
  keywords: ["Contact", "Airkrit", "Support", "Get in touch"],
  openGraph: {
    title: "Contact | Airkrit India",
    description:
      "Get in touch with Airkrit. We're updating this page — check back soon.",
    url: "https://www.airkrit.com/contact",
    siteName: "Airkrit India",
    type: "website",
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
    title: "Contact | Airkrit India",
    description:
      "Get in touch with Airkrit. We're updating this page — check back soon.",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const ContactLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard
      requiredUserType={["student", "admin", "super-admin"]}
      fallbackPath="/login"
      wrongRoleShowsNotFound
    >
      {children}
    </AuthGuard>
  );
};

export default ContactLayout;
