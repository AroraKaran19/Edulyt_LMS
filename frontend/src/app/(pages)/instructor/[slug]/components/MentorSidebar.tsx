"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { Instagram, Linkedin } from "lucide-react";

type ExperienceItem = {
  company: string;
  role: string;
  years: string;
};

export type MentorSidebarProps = {
  name: string;
  title: string;
  profileImage?: string;
  socials?: {
    linkedin?: string;
    instagram?: string;
  };
  totalExperienceLabel?: string; // e.g. "14+ years"
  experience?: ExperienceItem[];
  className?: string;
};

const SocialIconButton = ({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) => {
  if (!href) return null;
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="size-9 rounded-full border border-black/10 bg-white grid place-items-center shadow-[inset_0_-1px_2px_rgba(0,0,0,0.15)] hover:bg-[#fff7f2] transition-colors"
    >
      {children}
    </Link>
  );
};

const MentorSidebar = ({
  name,
  title,
  profileImage,
  socials,
  totalExperienceLabel,
  experience,
  className,
}: MentorSidebarProps) => {
  const hasExperience = (experience?.length ?? 0) > 0;
  const initials = (() => {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "I";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "I";
    return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase() || "I";
  })();

  return (
    <aside className={cn("w-full", className)}>
      <div className="">
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f5f5f5]">
          {profileImage ? (
            <Image
              src={profileImage}
              alt={name}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="w-full h-full grid place-items-center bg-[#FFE9DB]">
              <div className="size-24 sm:size-28 rounded-full bg-[#F77124] text-white grid place-items-center text-3xl sm:text-4xl font-extrabold select-none">
                {initials}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xl sm:text-2xl font-bold text-text-primary">
            {name}
          </p>
          <p className="text-sm text-text-primary/70">{title}</p>

          <div className="mt-3 flex items-center gap-2">
            <SocialIconButton
              href={socials?.linkedin}
              label={`${name} LinkedIn`}
            >
              <Linkedin className="size-4 text-[#0a66c2]" />
            </SocialIconButton>
            <SocialIconButton
              href={socials?.instagram}
              label={`${name} Instagram`}
            >
              <Instagram className="size-4 text-[#d62976]" />
            </SocialIconButton>
          </div>
        </div>
      </div>

      {hasExperience ? (
        <div className="mt-5 border-t border-black/30 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-2xl font-bold text-text-primary">Experience</p>
            {totalExperienceLabel ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-black text-white">
                {totalExperienceLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {experience?.map((item, idx) => (
              <div
                key={`${item.company}-${item.role}-${idx}`}
                className="rounded-xl border border-black/10 bg-white p-4 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-text-primary truncate">
                      {item.company}
                    </p>
                    <p className="text-sm text-text-primary/70 truncate">
                      {item.role}
                    </p>
                  </div>
                  <div className="shrink-0 text-right min-w-[72px]">
                    <p className="text-sm font-bold text-text-primary leading-none">
                      Years
                    </p>
                    <p className="text-sm text-text-primary/70 mt-2 leading-none">
                      {item.years}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
};

export default MentorSidebar;
