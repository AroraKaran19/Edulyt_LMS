"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  activeTabIndex?: number;
  onTabChange?: (index: number) => void;
}

const TabSwitcher = ({ tabs, className, activeTabIndex, onTabChange }: TabSwitcherProps) => {
  const [internalActiveTabLabel, setInternalActiveTabLabel] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevTabsLabelsRef = useRef<string>("");

  // Create stable label string for comparison
  const tabsLabels = tabs.map(t => t.label).join("|");

  // Only reset activeTab if tabs structure actually changed (labels changed)
  // This prevents reset when only component references change
  useEffect(() => {
    if (prevTabsLabelsRef.current !== tabsLabels) {
      prevTabsLabelsRef.current = tabsLabels;
      // Only set if we don't have an active tab or if the current active tab no longer exists
      if (!internalActiveTabLabel || !tabs.some(t => t.label === internalActiveTabLabel)) {
        setInternalActiveTabLabel(tabs[0]?.label || null);
      }
    }
  }, [tabsLabels, internalActiveTabLabel, tabs]);

  // If activeTabIndex is controlled externally, use it
  useEffect(() => {
    if (activeTabIndex !== undefined && tabs[activeTabIndex]) {
      setInternalActiveTabLabel(tabs[activeTabIndex].label);
    }
  }, [activeTabIndex, tabs]);

  // Find active tab by label (stable reference)
  const activeTab = tabs.find(t => t.label === internalActiveTabLabel) || tabs[0] || null;

  const handleTabClick = (tab: Tab, index: number) => {
    setInternalActiveTabLabel(tab.label);
    
    // Notify parent component if callback is provided
    if (onTabChange) {
      onTabChange(index);
    }
    
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
          "tab-switcher w-full p-1.5 flex items-stretch bg-[#FFF6F2] rounded-full overflow-x-auto md:overflow-hidden",
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
              "tab-switcher-tab w-7/10 md:w-full shrink-0 md:shrink cursor-pointer rounded-full flex flex-wrap items-center justify-center py-2 md:py-4 px-2",
              {
                "bg-linear-to-r from-[#F5691D] to-[#F9792A]": activeTab === tab,
              },
              "transition-colors duration-200 ease-in-out gap-2"
            )}
            onClick={() => handleTabClick(tab, index)}
          >
            <span
              className={cn(
                "flex items-center gap-1 text-sm font-bold md:text-base text-nowrap text-center",
                activeTab === tab ? "text-white" : "text-gray-800",
              )}
            >
              {tab.activeTabIcon && activeTab === tab && tab.activeTabIcon}
              {tab.label}
            </span>
            {typeof tab.showCount === 'number' && (
              <span
                className={cn(
                  "text-[10px] leading-none font-semibold px-1.5 py-1 rounded-full flex items-center justify-center",
                  activeTab === tab
                    ? "bg-white text-black"
                    : "bg-black text-white",
                  "transition-colors duration-200 ease-in-out",
                )}
              >
                {tab.showCount > 100 ? "100+" : tab.showCount}
              </span>
            )}
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {activeTab && (
          <motion.div
            key={activeTab.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            {activeTab.component}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TabSwitcher;
