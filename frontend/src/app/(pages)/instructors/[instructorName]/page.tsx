"use client";
import { useParams } from "next/navigation";
import React from "react";

const IndividualInstructorPage = () => {
  const { instructorName } = useParams();

  return (
    <div className="w-full bg-white rounded-2xl py-10 px-4 flex flex-col items-center sm:px-[15%]">
      <p className="text-2xl font-bold text-text-primary font-coolvetica">
        {instructorName}
      </p>
    </div>
  );
};

export default IndividualInstructorPage;
