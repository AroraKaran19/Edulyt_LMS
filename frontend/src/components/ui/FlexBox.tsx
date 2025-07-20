import { cn } from "@/lib/utils";
import React from "react";

const FlexBox = ({
  children,
  ...props
}: {
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn(`flex`, props.className)} onClick={props.onClick}>{children}</div>;
};

export default FlexBox;
