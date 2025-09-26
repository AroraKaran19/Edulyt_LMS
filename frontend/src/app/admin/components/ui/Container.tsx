import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";
import React from "react";

const Container = ({
  children,
  className,
  icon,
  title,
  description,
  classNameBody,
  ...props
}: { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement> & {
    id?: string;
    className?: string;
    icon?: React.ComponentType<{ className?: string }>;
    title?: string;
    description?: string;
    classNameBody?: string;
  }) => {
  return (
    <section
      className={cn(
        "w-full h-full bg-white border border-gray-300 rounded-2xl p-6 shadow-[0_0_10px_2px_rgba(0,0,0,0.1)] flex flex-col",
        className
      )}
      {...props}
    >
      <FlexBox className="container-header h-fit w-full gap-4 items-center mb-4">
        {icon && (
          <FlexBox className="container-header-icon p-3 shrink-0 bg-orange-500 text-white rounded-lg">
            {React.createElement(icon, { className: "size-6" })}
          </FlexBox>
        )}
        <FlexBox className="container-header-content w-full flex flex-col justify-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </FlexBox>
      </FlexBox>
      <FlexBox
        className={cn(
          "container-body w-full flex-1 gap-4 overflow-y-auto",
          classNameBody
        )}
        style={{ scrollbarWidth: "thin" }}
      >
        {children}
      </FlexBox>
    </section>
  );
};

export default Container;
