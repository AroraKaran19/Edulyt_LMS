import { cn } from "@/lib/utils";
import React from "react";
import FlexBox from "./FlexBox";

interface AlertMessage {
  message: string;
  type:
    | "success"
    | "error"
    | "warning"
    | "info"
    | "offer"
    | "limited-time-offer"
    | "global-discount";
}

const AlertBanner = ({
  message,
  type,
  ...props
}: AlertMessage & { className?: string }) => {
  return (
    <FlexBox
      className={cn(
        `w-full bg-[#F77124] max-h-[30px] text-sm gap-4 items-center py-2 px-4`,
        props.className
      )}
    >
			<h3 className="text-white font-semibold">{message}</h3>
			{/* Alert Category */}
			<div className="bg-gradient-to-br from-white/40 to-white/35 px-1 text-white my-1 rounded-sm">
				{type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ")}
			</div>
		</FlexBox>
  );
};

export default AlertBanner;
