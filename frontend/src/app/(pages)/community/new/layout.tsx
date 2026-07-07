import { Metadata } from "next";
import React from "react";
import AuthGuard from "@/app/providers/AuthGuard";

const description =
  "Share your experience, insights, or doubts with the Airkrit community and help others on their journey.";

export const metadata: Metadata = {
  title: "New Post | Airkrit India",
  description,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://www.airkrit.com"
        : "http://localhost:3000"),
  ),
  keywords: ["Community", "Airkrit", "New Post", "Share Experience"],
  openGraph: {
    title: "New Post | Airkrit India",
    description,
    url: "https://www.airkrit.com/community/new",
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
    title: "New Post | Airkrit India",
    description,
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const CommunityNewLayout = ({ children }: { children: React.ReactNode }) => {
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

export default CommunityNewLayout;
