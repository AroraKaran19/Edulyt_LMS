"use client";

import React, { useState, useEffect } from "react";
import { Filter } from "@/types";
import Sidebar from "./components/Sidebar";
import AddedCoursesContent from "./components/AddedCoursesContent";
import AddNewCourseContent from "./components/AddNewCourseContent";
import WelcomeContent from "./components/WelcomeContent";

const AdminDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("added-courses");
  const [showCourseContentDropdown, setShowCourseContentDropdown] = useState(false);
  
  // Search and Filter state for Added Courses
  const [search, setSearch] = useState("");
  const [filterShown, setFilterShown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [filters] = useState<Filter[]>([
    {
      label: "All",
      value: "all",
    },
    {
      label: "Data Science",
      value: "data-science",
      featureBox: {
        value: "100+",
      },
    },
    {
      label: "Machine Learning",
      value: "machine-learning",
    },
    {
      label: "AI",
      value: "ai",
      featureBox: {
        value: "200+",
      },
    },
    {
      label: "Web Development",
      value: "web-development",
    },
  ]);
  const [selectedFilter, setSelectedFilter] = useState<Filter[]>([
    {
      label: "All",
      value: "all",
    },
  ]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activeMenu === "add-course") {
      setShowCourseContentDropdown(true);
    } else {
      setShowCourseContentDropdown(false);
    }
  }, [activeMenu]);

  const isMobile = windowWidth === 0 ? true : windowWidth <= 1046;



  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Find the scrollable container (the form content area)
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top;
        const scrollTop = scrollContainer.scrollTop;
        const targetScrollTop = scrollTop + relativeTop - 20; // 20px padding from top
        
        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      } else {
        // Fallback to window scroll if container not found
        const headerHeight = 84;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight - 20;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId);
    if (menuId === "add-course") {
      setShowCourseContentDropdown(true);
    } else {
      setShowCourseContentDropdown(false);
    }
  };

  const handleFilterClick = (filter: Filter) => {
    if (filter.value === "all") {
      setSelectedFilter([filters[0]]);
    } else {
      const isCurrentlySelected = selectedFilter.some(
        (f) => f.value === filter.value
      );

      if (isCurrentlySelected) {
        const newSelection = selectedFilter.filter(
          (f) => f.value !== filter.value
        );
        setSelectedFilter(
          newSelection.length === 0 ? [filters[0]] : newSelection
        );
      } else {
        // If clicking on a new filter, add it and remove "All" if present
        const withoutAll = selectedFilter.filter((f) => f.value !== "all");
        setSelectedFilter([...withoutAll, filter]);
      }
    }
  };

  const renderMainContent = () => {
    switch (activeMenu) {
      case "added-courses":
        return (
          <AddedCoursesContent
            search={search}
            setSearch={setSearch}
            filterShown={filterShown}
            setFilterShown={setFilterShown}
            filters={filters}
            selectedFilter={selectedFilter}
            isMobile={isMobile}
            onFilterClick={handleFilterClick}
          />
        );
      case "add-course":
        return <AddNewCourseContent />;
      default:
        return <WelcomeContent />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        activeMenu={activeMenu}
        showCourseContentDropdown={showCourseContentDropdown}
        onToggleSidebar={toggleSidebar}
        onMenuClick={handleMenuClick}
        onScrollToSection={scrollToSection}
      />

      {/* Main Content */}
      <div className="flex-1">
          {renderMainContent()}
      </div>
    </div>
  );
};

export default AdminDashboard; 