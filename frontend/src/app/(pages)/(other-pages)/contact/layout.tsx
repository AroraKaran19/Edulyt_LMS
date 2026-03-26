import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Community | Edulyt",
  description:
    "Join the Edulyt community to share your journey, insights, and doubts. Connect with others and grow together.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.edulyt.com/community"
      : "http://localhost:3000/community"
  ),
  keywords: [
    "Community",
    "Edulyt",
    "Share Experience",
    "Career Journey",
    "Industry Experience",
  ],
  openGraph: {
    title: "Community | Edulyt",
    description:
      "Share your journey, doubts, or insights with the Edulyt community.",
    url: "https://www.edulyt.com/community",
    siteName: "Edulyt",
    type: "website",
    images: [
      {
        url: "https://www.edulyt.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community | Edulyt",
    description:
      "Share your journey, doubts, or insights with the Edulyt community.",
    images: [
      {
        url: "https://www.edulyt.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const CommunityPageLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default CommunityPageLayout;
