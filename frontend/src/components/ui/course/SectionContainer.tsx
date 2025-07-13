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
        `${id}-section w-full bg-white rounded-2xl px-4 md:px-6 lg:px-[13%] py-4 md:py-10 flex flex-col items-center justify-center gap-8`,
        className
      )}
    >
      {children}
    </section>
  );
};

export default SectionContainer;
