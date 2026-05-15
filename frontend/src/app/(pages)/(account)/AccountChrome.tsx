"use client";

import useAuth from "@/hooks/useAuth";
import DashboardNavbar from "@/app/(pages)/dashboard/components/DashboardNavbar";
import InstructorNavbar from "@/app/instructor/components/InstructorNavbar";
import UserMenu from "@/components/shared/User/UserMenu";
import Link from "next/link";

export default function AccountChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.userType) {
    case "student":
      return (
        <>
          <DashboardNavbar />
          <div className="pt-25">{children}</div>
        </>
      );
    case "instructor":
      return (
        <>
          <InstructorNavbar />
          <div className="pt-20 min-h-[calc(100vh-5rem)]">{children}</div>
        </>
      );
    case "admin":
    case "super-admin":
      return (
        <>
          <header className="fixed top-0 left-0 right-0 z-9999 flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-10">
            <Link
              href="/admin"
              className="text-sm font-semibold text-gray-800 hover:text-orange-600"
            >
              ← Admin dashboard
            </Link>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>
          <div className="pt-14">{children}</div>
        </>
      );
    case "partner":
      return (
        <>
          <header className="fixed top-0 left-0 right-0 z-9999 flex h-14 items-center gap-4 border-b border-orange-100 bg-[#FFF7F2] px-4 lg:px-10">
            <Link
              href="/partner/dashboard"
              className="text-sm font-semibold text-orange-700 hover:underline"
            >
              ← College portal
            </Link>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>
          <div className="pt-14">{children}</div>
        </>
      );
    case "collaborator":
      return (
        <>
          <header className="fixed top-0 left-0 right-0 z-9999 flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-10">
            <Link
              href="/"
              className="text-sm font-semibold text-gray-800 hover:text-orange-600"
            >
              ← Home
            </Link>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>
          <div className="pt-14">{children}</div>
        </>
      );
    default:
      return <div className="min-h-screen pt-14">{children}</div>;
  }
}
