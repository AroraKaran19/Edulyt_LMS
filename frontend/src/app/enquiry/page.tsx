import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import EnquiryLanding from "./EnquiryLanding";

const inter = Inter({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-eq-display",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-eq-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Airkrit: Learn it, then prove it",
  description:
    "Every Airkrit course, certifications from Cisco, Meta and Apple, a recommendation letter and a live internship. Pick your plan and we will send the details.",
  openGraph: {
    title: "Airkrit: Learn it, then prove it",
    description:
      "Courses, certifications, a recommendation letter and an internship. Three plans that build on each other.",
    type: "website",
  },
};

export default function EnquiryPage() {
  // EnquiryLanding reads the query string to restore the plan and certification a
  // student picked before the Google round trip, so it needs a boundary here.
  return (
    <div className={`${inter.variable} ${poppins.variable}`}>
      <Suspense fallback={<div className="min-h-dvh bg-[#fff6f1]" />}>
        <EnquiryLanding />
      </Suspense>
    </div>
  );
}
