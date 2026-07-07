"use client";

import React from "react";
import Image from "next/image";
import useAuth from "@/hooks/useAuth";
import { LinkedinIcon } from "@/components/ui/LinkedinIcon";
import type { Student } from "@/types";

const ProfileCard = () => {
    const { user, isLoading } = useAuth();
    const student = user as Partial<Student> | undefined;

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0,05)] border border-gray-100 mb-6 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-gray-50 shadow-sm" />
                    <div className="flex-1 space-y-2.5">
                        <div className="h-5 w-40 rounded bg-gray-200" />
                        <div className="h-4 w-56 rounded bg-gray-200" />
                        <div className="h-3 w-48 rounded bg-gray-200" />
                        <div className="h-3 w-36 rounded bg-gray-200 mt-3" />
                    </div>
                </div>
            </div>
        );
    }

    const fullName =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
        user?.email?.split("@")[0] ||
        "Member";

    const initials =
        (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") ||
        user?.email?.[0]?.toUpperCase() ||
        "?";

    const collegeName = student?.collegeName;
    const currentPosition = student?.currentPosition;
    const currentCompany = student?.currentCompany;
    const linkedinUrl = student?.linkedinUrl?.trim();
    const linkedinConnected = Boolean(linkedinUrl);
    const linkedinHref = linkedinUrl
        ? linkedinUrl.startsWith("http")
            ? linkedinUrl
            : `https://${linkedinUrl}`
        : undefined;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0,05)] border border-gray-100 mb-6">
            <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm bg-gray-100 flex items-center justify-center">
                    {user?.profilePicture ? (
                        <Image
                            src={user.profilePicture}
                            alt={fullName}
                            fill
                            sizes="96px"
                            className="object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-semibold text-gray-500">
                            {initials}
                        </span>
                    )}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-black leading-tight">
                        {fullName}
                    </h2>
                    {collegeName && (
                        <p className="text-sm font-semibold text-gray-800">
                            {collegeName}
                        </p>
                    )}
                    {(currentPosition || currentCompany) && (
                        <p className="text-xs text-gray-500 mt-1">
                            {currentPosition}
                            {currentPosition && currentCompany ? " at " : ""}
                            {currentCompany && (
                                <span className="text-orange-500 font-bold">
                                    {currentCompany}
                                </span>
                            )}
                        </p>
                    )}

                    <div className="mt-2.5">
                        {linkedinConnected ? (
                            <a
                                href={linkedinHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View LinkedIn profile"
                                className="inline-flex items-center gap-1.5 text-[#0A66C2] transition-opacity hover:opacity-80"
                            >
                                <LinkedinIcon className="w-5 h-5" />
                                <span className="text-xs font-semibold">
                                    LinkedIn
                                </span>
                            </a>
                        ) : (
                            <span
                                title="Add your LinkedIn URL in profile settings"
                                className="inline-flex items-center gap-1.5 text-gray-300"
                            >
                                <LinkedinIcon className="w-5 h-5" />
                                <span className="text-xs font-medium">
                                    Not linked
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
