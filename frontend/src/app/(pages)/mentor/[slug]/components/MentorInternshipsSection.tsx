"use client";

import { cn } from "@/lib/utils";
import InternshipCard from "@/app/(pages)/internships/components/InternshipCard";
import type { InternshipPublicListing } from "@/types/internship";

export type MentorInternshipsSectionProps = {
  title?: string;
  internships: InternshipPublicListing[];
  className?: string;
};

const MentorInternshipsSection = ({
  title = "Internships They Mentor",
  internships,
  className,
}: MentorInternshipsSectionProps) => {
  if (!internships || internships.length === 0) return null;

  return (
    <section className={cn("bg-white rounded-2xl p-4 sm:p-6", className)}>
      <p className="text-xl sm:text-2xl font-bold text-text-primary">
        {title}
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
        {internships.map((internship, idx) => (
          <InternshipCard
            key={`${internship.slug}-${idx}`}
            internship={internship}
            className="h-full"
          />
        ))}
      </div>
    </section>
  );
};

export default MentorInternshipsSection;
