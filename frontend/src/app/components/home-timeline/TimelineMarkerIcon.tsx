import { cn } from "@/lib/utils";

interface TimelineMarkerIconProps {
  size: "big" | "pill";
  children: React.ReactNode;
  className?: string;
}

const sizeMap = { big: 44, pill: 32 };

export default function TimelineMarkerIcon({
  size,
  children,
  className,
}: TimelineMarkerIconProps) {
  const px = sizeMap[size];
  return (
    <span
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center rounded-full bg-[#F77124]",
        size === "big" && "",
        className
      )}
      style={{ width: px, height: px }}
    >
      {children}
    </span>
  );
}
