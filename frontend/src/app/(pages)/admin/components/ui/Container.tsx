import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";
import React from "react";

const Container = ({
  children,
  ...props
}: { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement> & {
    id?: string;
    className?: string;
    icon?: React.ComponentType<{ className?: string }>;
    title?: string;
    description?: string;
  }) => {
  return (
    <section
      id={props.id}
      className={cn(
        "w-full h-max bg-white border border-gray-300 rounded-2xl p-6 shadow-[0_0_10px_2px_rgba(0,0,0,0.1)]",
        props.className
      )}
      {...props}
    >
      <FlexBox className="container-header w-full gap-4 items-center mb-4">
        {props.icon && (
          <FlexBox className="container-header-icon p-3 shrink-0 bg-orange-500 text-white rounded-lg">
            <props.icon className="size-6" />
          </FlexBox>
        )}
        <FlexBox className="container-header-content w-full flex-col justify-center">
          <h2 className="text-xl font-semibold">{props.title}</h2>
          <p className="text-sm text-gray-500">{props.description}</p>
        </FlexBox>
      </FlexBox>
      <FlexBox className="container-body w-full flex-col gap-4">
        {children}
      </FlexBox>
    </section>
  );
};

export default Container;
