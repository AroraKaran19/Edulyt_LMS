"use client";

import { CheckCircle, EllipsisVertical, FileUp, Users, UserCheck } from "lucide-react";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerFiltersButton from "@/components/ui/partner/PartnerFiltersButton";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import { collegePartnerStudentsJson } from "../../dummyData";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

const data = collegePartnerStudentsJson;
const statIcons = [
  <Users key="total" className="size-5" />,
  <UserCheck key="active" className="size-5" />,
  <CheckCircle key="enrollments" className="size-5" />,
  <CheckCircle key="internshipParticipants" className="size-5" />,
];

export default function CollegePartnerStudentsPage() {
  return (
    <div className="p-2 sm:p-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg sm:text-2xl font-semibold text-black">Students</h1>
        <OrangeButton
          glow={false}
          className="rounded-2xl py-2.5 px-5 text-sm font-semibold shadow-[0_0_14px_rgba(247,113,36,0.4)]"
        >
          <span className="inline-flex items-center gap-2">
            <FileUp className="size-4" />
            Upload Student CSV
          </span>
        </OrangeButton>
      </div>

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
            Enrolled Students
          </h2>
          <PartnerFiltersButton onClick={() => {}} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left border-b border-[#F2F4F7]">
                <th className="pb-3 font-semibold text-black">Student Name</th>
                <th className="pb-3 font-semibold text-black">Email</th>
                <th className="pb-3 font-semibold text-black">Program Name</th>
                <th className="pb-3 font-semibold text-black">Enrolment date</th>
                <th className="pb-3 font-semibold text-black">Status</th>
                <th className="pb-3 font-semibold text-right text-black"> </th>
              </tr>
            </thead>
            <tbody>
              {data.enrolledStudents.map((row, idx) => (
                <tr
                  key={`${row.studentName}-${idx}`}
                  className="border-b border-[#F2F4F7] last:border-0"
                >
                  <td className="py-3 font-medium text-[#1D2939]">{row.studentName}</td>
                  <td className="py-3 text-[#344054]">{row.email}</td>
                  <td className="py-3 text-[#344054]">{row.programName}</td>
                  <td className="py-3 text-[#344054]">{row.enrollmentDate}</td>
                  <td className="py-3 text-[#1D4ED8] font-medium">{row.status}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      className="cursor-pointer p-1 text-[#667085] transition-colors hover:text-[#344054]"
                      aria-label="Open row actions"
                    >
                      <EllipsisVertical className="size-4" />
                    </button>
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
