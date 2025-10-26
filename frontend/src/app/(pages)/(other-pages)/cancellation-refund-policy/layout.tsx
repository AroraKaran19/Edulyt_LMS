import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Airkrit",
  description: "Cancellation & Refund Policy | Airkrit",
  keywords: ["Cancellation & Refund Policy", "Airkrit"],
  robots: "index, follow",
  icons: {
    icon: "https://www.airkrit.com/logo.png",
  },
  openGraph: {
    title: "Cancellation & Refund Policy | Airkrit",
    description: "Cancellation & Refund Policy | Airkrit",
    type: "website",
    url: "https://www.airkrit.com/cancellation-refund-policy",
    siteName: "Airkrit",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cancellation & Refund Policy | Airkrit",
    description: "Cancellation & Refund Policy | Airkrit",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
};

const layout = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default layout;
