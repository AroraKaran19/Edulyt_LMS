import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enroll Now | Airkrit India",
  description:
    "Join our Data Analytics program and start your journey towards a successful career. Enroll now for industry-relevant skills.",
  keywords: ["Enroll Now", "Airkrit India", "Enroll Now | Airkrit India"],
  openGraph: {
    title: "Enroll Now | Airkrit India",
    description:
      "Join our Data Analytics program and start your journey towards a successful career. Enroll now for industry-relevant skills.",
    type: "website",
    url: "https://www.airkrit.com/enroll",
    siteName: "Airkrit India",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    title: "Enroll Now | Airkrit India",
    description:
      "Join our Data Analytics program and start your journey towards a successful career. Enroll now for industry-relevant skills.",
    images: [
      {
        url: "https://www.airkrit.com/logo.png",
        width: 1200,
        height: 630,
      },
    ],
    card: "summary_large_image",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/enroll"
      : "http://localhost:3000/enroll",
  ),
};

export default function EnrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
