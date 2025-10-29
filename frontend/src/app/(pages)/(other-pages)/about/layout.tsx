import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Airkrit",
  description:
    "Learn about Airkrit's mission to empower students and professionals with industry-relevant skills through comprehensive online courses and internship opportunities.",
  keywords: [
    "About Airkrit",
    "Airkrit India",
    "Online Learning",
    "Skill Development",
    "Airkrit Mission",
    "Airkrit Values",
    "Airkrit Team",
  ],
  openGraph: {
    title: "About Us | Airkrit",
    description:
      "Learn about Airkrit's mission to empower students and professionals with industry-relevant skills through comprehensive online courses and internship opportunities.",
    type: "website",
    url: "https://www.airkrit.com/about",
    siteName: "Airkrit",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Airkrit - About Us",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Airkrit",
    description:
      "Learn about Airkrit's mission to empower students and professionals with industry-relevant skills through comprehensive online courses and internship opportunities.",
    images: ["https://www.airkrit.com/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/about"
      : "http://localhost:3000/about"
  ),
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
