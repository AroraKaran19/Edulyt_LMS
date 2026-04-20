import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import EnrollForm from "./components/EnrollForm";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const EnrollPage = () => {
  return (
    <div className={cn("min-h-screen bg-[#fffbf8] py-12 px-4 md:px-8", plusJakartaSans.className)}>
      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center max-w-4xl mx-auto mb-6">
          <span className="bg-red-50 text-red-500 text-[10px] font-bold px-4 py-1.5 rounded-full border border-red-100 uppercase tracking-wider">
            Education to Employment
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl max-w-4xl mx-auto md:text-3xl font-extrabold text-[#111827] text-center mb-10 leading-tight">
          Enroll Yourself for Data Analytics (AI & ML / SAS & Python / Tableau & Power BI / Excel & SQL) - January 2026
        </h1>

        <EnrollForm />
      </div>
    </div>
  );
};

export default EnrollPage;
