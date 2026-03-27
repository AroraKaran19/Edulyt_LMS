"use client";

import AuthGuard from "@/app/providers/AuthGuard";
import InstructorNavbar from "./components/InstructorNavbar";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard
      requiredUserType={["instructor"]}
      fallbackPath="/dashboard"
    >
      <div className="min-h-screen bg-[#F8F9FB]">
        <InstructorNavbar />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
