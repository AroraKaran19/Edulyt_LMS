import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Contact Us | Airkrit",
  description: "Contact Us | Airkrit",
  keywords: ["Contact Us", "Airkrit", "Contact Us Page", "Contact Us Form", "Contact Us Information", "Contact Us Details"],
  robots: "index, follow",
  icons: {
    icon: "https://www.airkrit.com/logo.png",
  },
  openGraph: {
    title: "Contact Us | Airkrit",
    description: "Contact Us | Airkrit",
    type: "website",
    url: "https://www.airkrit.com/contact",
    siteName: "Airkrit",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Airkrit",
    description: "Contact Us | Airkrit",
    images: [{ url: "https://www.airkrit.com/logo.png" }],
  },
};

const layout = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default layout;
