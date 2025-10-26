import { cn } from "@/lib/utils";
import React from "react";

const SectionContainer = ({
  children,
  id,
  className,
}: {
  children?: React.ReactNode;
  id?: string;
  className?: string;
}) => {
  return (
    <section
      id={id}
      className={cn(
        "w-full bg-white rounded-2xl p-3 flex flex-col justify-center items-center",
        className
      )}
    >
      {children}
    </section>
  );
};

export default SectionContainer;
