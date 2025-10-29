"use client";
import { cn } from "@/lib/utils";
import { CheckIcon } from "../../../../../public/icons";
import { Fragment } from "react";
import { DownloadIcon } from "lucide-react";
import { Course } from "@/types";

interface CartStep {
  title: string;
  isActive?: boolean;
  completed: boolean;
}

const CartFormHeader = ({
  course,
  cartSteps,
  handleStepClick,
}: {
  course: Course;
  cartSteps: CartStep[];
  handleStepClick: (index: number) => void;
}) => {
  return (
    <div className="cart-header h-full w-full flex flex-col gap-5 lg:flex-row items-center bg-white px-2.25 py-2.5 rounded-3xl overflow-x-auto">
      <div className="w-full flex items-center overflow-x-auto">
        {cartSteps.map((step, index) => (
          <Fragment key={index}>
            <div
              className={cn(
                "flex w-full bg-white max-w-[147px] shrink-0 items-center gap-2 py-2.5 pl-2 rounded-3xl border border-[#23CB02]/12 hover:bg-green/50 cursor-pointer select-none",
                step.completed || (step.isActive && "bg-[#23CB02]/12"),
                !step.completed || (!step.isActive && "bg-white")
              )}
              onClick={() => handleStepClick(index)}
            >
              <CheckIcon
                className={cn(
                  "size-6 text-[#23CB02]",
                  !step.completed &&
                    !step.isActive &&
                    "opacity-50 text-[#23CB02]/50!"
                )}
              />
              <span className="text-base font-bold text-green-800">
                {step.title}
              </span>
            </div>
            {index < cartSteps.length - 1 && (
              <div className="w-5 h-0.5 bg-gray-200 shrink-0"></div>
            )}
          </Fragment>
        ))}
      </div>
      {course.brochure && course.brochure !== "" && (
        <button
          className="lg:ml-auto flex items-center gap-2 bg-black shadow-[inset_0_0px_15px_5px_rgba(255,255,255,0.3)] hover:shadow-[inset_0_2px_15px_5px_rgba(255,255,255,0.3)] transition-all duration-300 ease-in-out text-white py-3.25 px-6.5 rounded-full cursor-pointer whitespace-nowrap"
          onClick={async () => {
            try {
              const response = await fetch(course.brochure!);

              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = `${course.title}-brochure.pdf`;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                window.URL.revokeObjectURL(url);
              } else {
                window.open(course.brochure!, "_blank");
              }
            } catch (error) {
              console.error("Download failed:", error);
              // Fallback: open in new tab
              window.open(course.brochure!, "_blank");
            }
          }}
        >
          <span className="text-base font-medium">Download Brochure</span>
          <DownloadIcon className="size-6 text-white" />
        </button>
      )}
    </div>
  );
};

export default CartFormHeader;
