import { cloneElement, useEffect, useState } from "react";
import { HatIcon, ProjectIcon, GrowthIcon } from "../../../../../public/icons";
import { cn } from "@/lib/utils";

interface GuidanceItem {
  title: string;
  description: string;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  isActive?: boolean;
}

const GuidanceContainer = () => {
  const [guidanceData, setGuidanceData] = useState<GuidanceItem[]>([
    {
      title: "Expert Guidance",
      description:
        "Receive guidance and mentorship from seasoned professionals (having 10+ years of experience).",
      icon: <HatIcon className="size-6 text-black" />,
      isActive: true,
    },
    {
      title: "Live Projects & Tools",
      description:
        "Receive guidance and mentorship from seasoned professionals (having 10+ years of experience).",
      icon: <ProjectIcon className="size-6 text-black" />,
    },
    {
      title: "Career Development",
      description:
        "Receive guidance and mentorship from seasoned professionals (having 10+ years of experience).",
      icon: <GrowthIcon className="size-6 text-green-800" />,
    },
  ]);

  useEffect(() => {
    let currentIndex = 0;

    const interval = setInterval(() => {
      setGuidanceData((prev) => {
        const newIndex = (currentIndex + 1) % prev.length;
        currentIndex = newIndex;

        return prev.map((item, index) => ({
          ...item,
          isActive: index === newIndex,
        }));
      });
    }, 5000); // Change every 5 seconds for smoother experience

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full p-3 flex flex-col gap-6">
      {guidanceData.map((item, index) => (
        <div
          key={index}
          className={cn(
            "w-full border-3 border-white p-0.25 rounded-2xl transition-all duration-300 ease-in-out",
            item.isActive && "bg-[#F77124] border-[#FFF5EF]"
          )}
        >
          <div
            className={cn(
              "guidance-card flex flex-col gap-2 text-black p-3 rounded-xl transition-all duration-300 ease-in-out",
              item.isActive && "bg-[#FFF5EF]"
            )}
          >
            {cloneElement(
              item.icon as React.ReactElement<React.SVGProps<SVGSVGElement>>,
              {
                className: cn(
                  "size-10.5 text-black shrink-0",
                  item.isActive && "text-[#F77124]"
                ),
              }
            )}
            <h3 className="text-lg font-bold">{item.title}</h3>
            <p className="text-sm">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GuidanceContainer;
