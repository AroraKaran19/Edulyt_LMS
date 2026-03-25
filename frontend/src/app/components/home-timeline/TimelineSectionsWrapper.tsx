"use client";

interface TimelineSectionsWrapperProps {
  children: React.ReactNode;
  className?: string;
  svgStyle?: string;
}

/**
 * One vertical dashed line for all sections. How it works:
 * - Single div with border-left dashed, position absolute, top-0 bottom-0, left: 21 (so 2px line centers at 22px).
 * - Each section’s big icon (44px) is placed at start of row so its center is at 22px → line runs through icons.
 * - To draw a dashed line only between two icons: add a div in that section with position absolute, top = bottom of first icon, height = gap to next icon, same left: 21 and border-l-2 border-dashed.
 */
export default function TimelineSectionsWrapper({
  children,
  className,
  svgStyle
}: TimelineSectionsWrapperProps) {
  return (
    <section className={className} aria-label="Timeline sections">
      <div className="relative w-full px-0 sm:px-4 bg-[#FFFCFA]">
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 w-px border-l-2 border-dashed border-[#C8C8C8] left-[21px] sm:left-28 ${svgStyle}`}
        />
        <div className="relative">{children}</div>
      </div>
    </section>
  );
}
