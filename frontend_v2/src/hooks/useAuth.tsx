"use client";
import { User } from "@/types";
import { signOut, useSession } from "next-auth/react";

export default function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user as User;
  const accessToken = session?.accessToken as string;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isUnauthenticated = status === "unauthenticated";

  return {
    session,
    status,
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    isUnauthenticated,
    handleSignOut: signOut,
  };
}
