"use client";

import AuthGuard from "@/app/providers/AuthGuard";
import AccountChrome from "./AccountChrome";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AccountChrome>{children}</AccountChrome>
    </AuthGuard>
  );
}
