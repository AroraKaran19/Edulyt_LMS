import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Internships | Airkrit India",
  description:
    "Explore our wide range of internships and find the perfect one for you.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/internships"
      : "http://localhost:3000/internships",
  ),
  keywords: [
    "Internships",
    "Airkrit India",
    "Online Internships",
    "Learn Online",
  ],
  openGraph: {
    title: "Internships | Airkrit India",
    description:
      "Explore our wide range of internships and find the perfect one for you.",
    url: "https://www.airkrit.com/internships",
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
    title: "Internships | Airkrit India",
    description:
      "Explore our wide range of internships and find the perfect one for you.",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const InternshipsLayout = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default InternshipsLayout;
