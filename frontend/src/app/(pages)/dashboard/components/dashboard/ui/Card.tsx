import FlexBox from "@/components/ui/FlexBox";
import { cn } from "@/lib/utils";
import React from "react";

interface CardProps {
  title: string;
  count?: number;
  className?: string;
  icon?: React.ReactNode;
}

const Card = ({ title, count, className, icon }: CardProps) => {
  return (
    <FlexBox className={cn("py-2 px-2 w-[150px] items-center gap-2 rounded-lg border border-gray-200 overflow-hidden", className)}>
      <div className="icon-container text-[#5D00FF] shrink-0 select-none">{icon && icon}</div>
      <FlexBox className="flex-col text-black min-w-0 flex-1">
        <span className="text-lg font-bold">{count || 0}</span>
        <h3 className="text-sm font-normal truncate">{title}</h3>
      </FlexBox>
    </FlexBox>
  );
};

export default Card;
