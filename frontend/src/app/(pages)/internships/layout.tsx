import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Internship Program | Airkrit India",
  description:
    "Join our internship program to gain real industry experience and practical skills. Learn from experienced mentors and build your career.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/internship"
      : "http://localhost:3000/internship"
  ),
  keywords: [
    "Internship",
    "Airkrit India",
    "Internship Program",
    "Career Development",
    "Industry Experience",
  ],
  openGraph: {
    title: "Internship Program | Airkrit India",
    description:
      "Join our internship program to gain real industry experience and practical skills.",
    url: "https://www.airkrit.com/internship",
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
    title: "Internship Program | Airkrit India",
    description:
      "Join our internship program to gain real industry experience and practical skills.",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const InternshipPageLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default InternshipPageLayout;
