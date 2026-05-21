"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import type { Student } from "@/types";

type Props = {
  reviewCount?: number;
};

const WritePostCard = ({ reviewCount = 0 }: Props) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const isStudent = user?.userType === "student";

  if (isLoading) {
    return (
      <div className="w-full max-w-lg bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4 mt-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="flex gap-3">
              <div className="h-3 w-12 rounded bg-gray-200" />
              <div className="h-3 w-16 rounded bg-gray-200" />
            </div>
          </div>
        </div>
        <div className="h-10 w-32 rounded-full bg-gray-200" />
      </div>
    );
  }

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    (isAuthenticated ? "Member" : "Guest");

  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  const successPoints = (user as Partial<Student> | undefined)?.successPoints ?? 0;

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4 mt-6">
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-orange-100 bg-gray-100">
          {user?.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={fullName}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
              {initials}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-md sm:text-lg text-gray-900 leading-tight">
            {fullName}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <span className="text-[#F77124] font-bold">{successPoints}</span>
              <span className="text-yellow-400">★</span>
              <span className="text-xs font-bold text-gray-400 ml-1">SP</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-900">{reviewCount}</span>
              <span className="text-xs font-bold text-gray-400 ml-1">
                Reviews
              </span>
            </div>
          </div>
        </div>
      </div>

      {isStudent ? (
        <button
          type="button"
          onClick={() => router.push("/community/new")}
          className="bg-[#F77124] text-xs sm:text-base text-white font-bold px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-[#e66013] transition-colors shadow-[0_4px_12px_rgba(247,113,36,0.3)]"
        >
          <Plus size={20} strokeWidth={3} />
          <span className="hidden sm:block">Write a post</span>
        </button>
      ) : (
        <button
          type="button"
          disabled
          title="Only students can post a review"
          aria-label="Only students can post a review"
          className="bg-gray-200 text-xs sm:text-base text-gray-500 font-bold px-6 py-2.5 rounded-full flex items-center gap-2 cursor-not-allowed"
        >
          <Plus size={20} strokeWidth={3} />
          <span className="hidden sm:block">Write a post</span>
        </button>
      )}
    </div>
  );
};

export default WritePostCard;
