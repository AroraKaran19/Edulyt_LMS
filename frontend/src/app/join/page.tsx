import type { Metadata } from "next";
import JoinLanding from "./JoinLanding";

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

export default function JoinPage() {
  return <JoinLanding />;
}
