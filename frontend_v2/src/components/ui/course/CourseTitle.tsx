import { cn } from "@/lib/utils";
import React from "react";

const CourseTitle = ({
  title,
  className,
}: {
  title: string;
  className?: string;
}) => {
  return (
    <h2 className={cn("text-3xl font-normal font-coolvetica", className)}>
      {title}
    </h2>
  );
};

export default CourseTitle;
