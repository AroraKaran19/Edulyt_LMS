"use client";
import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  component: React.ReactNode;
  showCount?: number;
  activeTabIcon?: React.ReactNode;
};

interface TabSwitcherProps {
  tabs: Tab[];
  className?: string;
}

const TabSwitcher = ({ tabs, className }: TabSwitcherProps) => {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setActiveTab(tabs[0]);
  }, [tabs]);

  const handleTabClick = (tab: Tab, index: number) => {
    setActiveTab(tab);
    
    // Scroll to the clicked tab in mobile view
    if (tabRefs.current[index]) {
      tabRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <div
        className={cn(
          "tab-switcher w-full p-1.5 flex items-center bg-[#FFF6F2] rounded-full overflow-x-auto md:overflow-hidden",
          className
        )}
      >
        {tabs.map((tab, index) => (
          <div
            key={index}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            className={cn(
              "tab-switcher-tab w-6/10 md:w-full shrink-0 md:shrink cursor-pointer rounded-full flex items-center justify-center py-2 md:py-4",
              {
                "bg-gradient-to-r from-[#F5691D] to-[#F9792A]": activeTab === tab,
              },
              "transition-colors duration-200 ease-in-out gap-2"
            )}
            onClick={() => handleTabClick(tab, index)}
          >
            <span
              className={cn(
                "flex items-center gap-1 text-sm font-bold md:text-base",
                activeTab === tab ? "text-white" : "text-gray-800",
              )}
            >
              {tab.activeTabIcon && activeTab === tab && tab.activeTabIcon}
              {tab.label}
            </span>
            {tab.showCount && (
              <span
                className={cn(
                  "text-[10px] leading-none font-semibold px-1.5 py-1 rounded-full flex items-center justify-center",
                  activeTab === tab
                    ? "bg-white text-black"
                    : "bg-black text-white",
                  "transition-colors duration-200 ease-in-out",
                )}
              >
                {tab.showCount}
              </span>
            )}
          </div>
        ))}
      </div>
      {activeTab && activeTab.component}
    </div>
  );
};

export default TabSwitcher;
