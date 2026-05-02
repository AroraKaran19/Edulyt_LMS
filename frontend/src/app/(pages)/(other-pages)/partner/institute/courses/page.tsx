"use client";

import { BookOpen, Percent, Users, Wallet } from "lucide-react";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerFiltersButton from "@/components/ui/partner/PartnerFiltersButton";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import PartnerViewButton from "@/components/ui/partner/PartnerViewButton";
import { institutePartnerCoursesJson } from "../../dummyData";

const data = institutePartnerCoursesJson;
const statIcons = [
  <BookOpen key="courses" className="size-5" />,
  <Users key="enrollments" className="size-5" />,
  <Percent key="discount" className="size-5" />,
  <Wallet key="revenue" className="size-5" />,
];

export default function InstitutePartnerCoursesPage() {
  return (
    <div className="p-2 sm:p-4 py-6 space-y-4">
      <h1 className="text-lg sm:text-2xl font-semibold text-black">
        Welcome Back
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {data.stats.map((s, i) => (
          <PartnerStatCard
            key={s.key}
            icon={statIcons[i] ?? statIcons[0]}
            value={s.value}
            label={s.label}
            deltaText={s.delta}
          />
        ))}
      </div>

      <PartnerCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-xl leading-none font-semibold text-black">
            Popular Courses
          </h2>
          <PartnerFiltersButton onClick={() => {}} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left border-b border-[#F2F4F7]">
                <th className="pb-3 font-semibold text-black">Program Name</th>
                <th className="pb-3 font-semibold text-black">Category</th>
                <th className="pb-3 font-semibold text-black">Students Enrolled</th>
                <th className="pb-3 font-semibold text-black">Duration</th>
                <th className="pb-3 font-semibold text-right text-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.popularCourses.map((row, idx) => (
                <tr
                  key={`${row.programName}-${idx}`}
                  className="border-b border-[#F2F4F7] last:border-0"
                >
                  <td className="py-3 font-medium text-[#1D2939]">
                    {row.programName}
                  </td>
                  <td className="py-3 text-[#344054]">{row.category}</td>
                  <td className="py-3 text-[#344054]">{row.studentsEnrolled}</td>
                  <td className="py-3 text-[#344054]">{row.duration}</td>
                  <td className="py-3 text-right">
                    <PartnerViewButton />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PartnerCard>
    </div>
  );
}
