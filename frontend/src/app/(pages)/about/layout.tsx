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
    url: "https://airkrit.com/about",
    siteName: "Airkrit",
    images: [
      {
        url: "/logo.png",
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
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://airkrit.com/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
