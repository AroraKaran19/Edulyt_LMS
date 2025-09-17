import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Contact Us | Airkrit",
  description: "Contact Us | Airkrit",
  keywords: ["Contact Us", "Airkrit"],
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
  },
};

const layout = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default layout;
