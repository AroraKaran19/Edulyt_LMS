import React from "react";

const CoursesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex flex-col gap-10 p-6 bg-[rgba(226,226,226,0.4)]">
      {children}
    </div>
  );
};

export default CoursesLayout;
