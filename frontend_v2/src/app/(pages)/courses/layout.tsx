import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Courses | Airkrit India",
  description:
    "Explore our wide range of courses and find the perfect one for you.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production"
      ? "https://www.airkrit.com/courses"
      : "http://localhost:3000/courses"
  ),
  openGraph: {
    title: "Courses | Airkrit India",
    description:
      "Explore our wide range of courses and find the perfect one for you.",
    url: "https://www.airkrit.com/courses",
    siteName: "Airkrit India",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Courses | Airkrit India",
    description:
      "Explore our wide range of courses and find the perfect one for you.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const CoursePageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full flex flex-col gap-10 p-4 bg-[rgba(226,226,226,0.4)]">
      {children}
    </div>
  );
};

export default CoursePageLayout;
