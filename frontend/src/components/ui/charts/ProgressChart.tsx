import { cn } from "@/lib/utils";
import React from "react";

const ProgressChart = ({
  percentage,
  primaryColor,
  secondaryColor,
  size,
  ...props
}: {
  percentage: number;
  primaryColor: string;
  secondaryColor: string;
  size?: number;
  inset?: number;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("progress-ring relative aspect-square rounded-full", props?.className)}
      style={{
        background: `conic-gradient(${
          percentage === 100 ? "#24F795" : primaryColor
        } 0% ${percentage}%, ${secondaryColor} ${percentage}% 100%)`,
        transform: "scaleX(-1)",
        width: size,
        height: size,
      }}
    >
      <div className="absolute bg-white rounded-full" style={{ inset: props.inset ?? "4px" }} />
    </div>
  );
};

export default ProgressChart;
