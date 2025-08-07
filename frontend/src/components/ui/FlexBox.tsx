import { cn } from "@/lib/utils";
import React from "react";

const FlexBox = ({
  direction = "row",
  children,
  ...props
}: {
  direction?: "row" | "col";
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(`flex flex-${direction}`, props.className)}
      onClick={props.onClick}
    >
      {children}
    </div>
  );
};

export default FlexBox;
