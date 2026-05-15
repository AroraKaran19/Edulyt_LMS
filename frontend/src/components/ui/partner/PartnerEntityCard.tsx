"use client";

import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import ImageComponent from "@/components/ui/ImageComponent";
import PartnerCard from "@/components/ui/partner/PartnerCard";

export default function PartnerEntityCard({
  href,
  title,
  thumbnail,
  tags,
  metricLabel,
  metricValue,
}: {
  href: string;
  title: string;
  thumbnail: string;
  tags: string[];
  metricLabel: string;
  metricValue: number;
}) {
  return (
    <Link href={href} className="group block">
      <PartnerCard className="flex h-full flex-col overflow-hidden p-0 transition-shadow group-hover:shadow-md">
        <div className="relative h-36 w-full bg-[#F2F4F7]">
          {thumbnail ? (
            <ImageComponent
              src={thumbnail}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#98A2B3]">
              <ImageIcon className="size-8" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-[#1D2939]">
            {title}
          </h3>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[#FFF1E8] px-2 py-0.5 text-[11px] font-medium text-[#B54708]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-xs text-[#667085]">
              <span className="text-base font-semibold tabular-nums text-[#1D2939]">
                {metricValue}
              </span>{" "}
              {metricLabel}
            </span>
            <ArrowRight className="size-4 text-[#F77124]" />
          </div>
        </div>
      </PartnerCard>
    </Link>
  );
}
