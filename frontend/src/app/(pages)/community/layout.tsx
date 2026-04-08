import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Community | Airkrit India",
  description:
    "Join the Airkrit community to share your journey, insights, and doubts. Connect with others and grow together.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/community"
      : "http://localhost:3000/community",
  ),
  keywords: ["Community", "Airkrit", "Community | Airkrit"],
  openGraph: {
    title: "Community | Airkrit India",
    description:
      "Join the Airkrit community to share your journey, insights, and doubts. Connect with others and grow together.",
    url: "https://www.airkrit.com/community",
    siteName: "Airkrit",
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
    title: "Community | Airkrit India",
    description:
      "Join the Airkrit community to share your journey, insights, and doubts. Connect with others and grow together.",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#FDFDFD] px-4 md:px-6 lg:px-8">
      {children}
    </main>
  );
}
