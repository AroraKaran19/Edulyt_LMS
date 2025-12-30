import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enroll Now | Airkrit",
  description: "Join our Data Analytics program and start your journey towards a successful career. Enroll now for industry-relevant skills.",
};

export default function EnrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

