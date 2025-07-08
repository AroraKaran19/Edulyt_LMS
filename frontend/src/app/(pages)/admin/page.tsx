"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  List, 
  Plus,
  GraduationCap,
  Search,
  ChevronDown
} from "lucide-react";
import OrangeButton from "@/components/ui/OrangeButton";
import WhiteButton from "@/components/ui/WhiteButton";
import { Filter } from "@/types";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  isHeader?: boolean;
};

const AdminDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("added-courses");
  
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

  const isMobile = windowWidth === 0 ? true : windowWidth <= 1046;

  const menuItems: MenuItem[] = [
    {
      id: "courses-header",
      label: "Courses",
      icon: <GraduationCap className="w-5 h-5" />,
      isHeader: true,
    },
    {
      id: "added-courses",
      label: "Added Courses",
      icon: <List className="w-5 h-5" />,
    },
    {
      id: "add-course",
      label: "Add New Course",
      icon: <Plus className="w-5 h-5" />,
    },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
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
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Added Courses
                </h2>
                <p className="text-gray-600">
                  Manage and view all your existing courses
                </p>
              </div>
              <OrangeButton className="text-sm font-semibold" blinkIcon>
                Add New Course
              </OrangeButton>
            </div>

            {/* Search and Filter Section */}
            <div className="search-container w-full mb-6 flex gap-6 items-stretch flex-col md:flex-row">
              {/* Search Bar */}
              <div className="courses-search-bar w-full bg-[#F5F5F5] p-4 shrink rounded-xl flex gap-2 items-center border border-black/10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]">
                <Search className="size-6 text-black/30" />
                <input
                  type="text"
                  placeholder="Search course name by title or type"
                  className="w-full h-full placeholder:text-black/30 bg-transparent outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filter Button */}
              <div
                className="courses-filter md:max-w-[190px] shrink-0 flex gap-2 items-center justify-center border border-black/10 rounded-xl p-2 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)] px-8 relative cursor-pointer"
                onClick={() => setFilterShown(!filterShown)}
              >
                <span className="text-[16px] font-bold text-[#2B1508] select-none">
                  Filter{" "}
                  {selectedFilter?.some((f) => f.value === "all")
                    ? ""
                    : selectedFilter?.length
                    ? `(${selectedFilter.length})`
                    : ""}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-[#2B1508] transition-transform duration-300 ease-in-out",
                    filterShown ? "rotate-180" : ""
                  )}
                />
              </div>
            </div>

            {/* Filter Options */}
            {filterShown && (
              <div className={`filter-options w-full mb-6 bg-[#FFF6F2] rounded-full flex gap-2 items-stretch animate-fade-from-top p-2 border-2 border-[#F5691D] ${
                isMobile ? "overflow-scroll" : "overflow-x-auto"
              }`}>
                {filters.map((filter, index) => (
                  <div
                    key={index}
                    className={cn(
                      `filter-option text-[16px] py-2 px-4 font-bold text-[#2B1508] rounded-full select-none cursor-pointer text-center flex gap-2 items-center justify-center`,
                      selectedFilter?.some((f) => f.value === filter.value)
                        ? "bg-[linear-gradient(rgba(245,105,29,0.9)_0%,rgba(245,105,29,0.9)_100%)] text-white"
                        : "hover:bg-[rgba(247,113,36,0.1)] hover:text-[rgba(247,113,36,0.8)]"
                    )}
                    style={{
                      minWidth: isMobile ? "150px" : "auto",
                      width: isMobile ? "auto" : `${100 / filters.length}%`,
                      flexShrink: isMobile ? 0 : 1,
                    }}
                    onClick={() => handleFilterClick(filter)}
                  >
                    <span className="text-lg">{filter.label}</span>
                    {filter.featureBox && (
                      <span className="text-[10px] font-normal px-1.5 py-0.75 rounded-full bg-[#F5691D] text-white">
                        {filter.featureBox.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Courses Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <BookOpen className="w-16 h-16 text-[#F77124] mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No courses found
              </h3>
              <p className="text-gray-600 mb-6">
                {search 
                  ? `No courses match "${search}"` 
                  : "Start by adding your first course"}
              </p>
              <OrangeButton className="text-sm font-semibold" blinkIcon>
                Add Your First Course
              </OrangeButton>
            </div>
          </div>
        );
      case "add-course":
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                  Add New Course
                </h2>
                <p className="text-gray-600">
                  Create and publish a new course for your students
                </p>
              </div>
              <div className="flex gap-3">
                <WhiteButton className="text-sm font-medium">
                  Preview
                </WhiteButton>
                <OrangeButton className="text-sm font-semibold">
                  Publish Course
                </OrangeButton>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form className="space-y-8">
                {/* Basic Information */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course ID *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="e.g., data-science-101"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Title *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="e.g., Complete Data Science Bootcamp"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="e.g., Master Python, Pandas, NumPy, and Machine Learning"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="Detailed course description..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description
                      </label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="Brief course summary..."
                      />
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]">
                        <option value="">Select Category</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Machine Learning">Machine Learning</option>
                        <option value="AI">AI</option>
                        <option value="Web Development">Web Development</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategory
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="e.g., Python"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skill Level *
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]">
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="College Students">College Students</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language *
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]">
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Spanish">Spanish</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="e.g., 45 hours"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Lectures *
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="120"
                      />
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thumbnail URL *
                      </label>
                      <input
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="https://example.com/thumbnail.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preview Video URL *
                      </label>
                      <input
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="https://example.com/preview.mp4"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Plans */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Professionals Plan */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">Professionals Plan</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price *
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                            placeholder="299"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Features *
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                            placeholder="Enter features (one per line)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* College Students Plan */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">College Students Plan</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price *
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                            placeholder="199"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Features *
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                            placeholder="Enter features (one per line)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Learning Outcomes</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What You Will Learn *
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="Enter learning outcomes (one per line)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Who Should Join *
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="Target audience description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prerequisites
                      </label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="Enter prerequisites (one per line)"
                      />
                    </div>
                  </div>
                </div>

                {/* Course Features */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Features</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Features *
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="Enter course features (one per line)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="e.g., python, data-science, machine-learning"
                      />
                    </div>
                  </div>
                </div>

                {/* SEO */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slug *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="complete-data-science-bootcamp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="SEO title for search engines"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description
                      </label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="SEO description for search engines"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keywords
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#F77124] focus:ring-[#F77124]"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured Course</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#F77124] focus:ring-[#F77124]"
                        />
                        <span className="ml-2 text-sm text-gray-700">Certified Course</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#F77124] focus:ring-[#F77124]"
                          defaultChecked
                        />
                        <span className="ml-2 text-sm text-gray-700">Active Course</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Created By
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F77124]"
                        placeholder="admin"
                        defaultValue="admin"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <WhiteButton className="text-sm font-medium">
                Save as Draft
              </WhiteButton>
              <WhiteButton className="text-sm font-medium">
                Preview
              </WhiteButton>
              <OrangeButton className="text-sm font-semibold">
                Publish Course
              </OrangeButton>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <GraduationCap className="w-16 h-16 text-[#F77124] mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Welcome to Admin Dashboard
            </h2>
            <p className="text-gray-600">
              Select a menu item to get started
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[rgba(226,226,226,0.4)]">
      {/* Sidebar */}
      <div className={cn(
        "bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-19" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className={cn(
          "p-4 border-b border-gray-200 flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-[#F77124]" />
              <h1 className="text-lg font-semibold text-gray-800">Admin Panel</h1>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.isHeader ? (
                !isCollapsed && (
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                )
              ) : (
                <button
                  onClick={() => setActiveMenu(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left",
                    isCollapsed && "justify-center",
                    activeMenu === item.id
                      ? "bg-[#F77124] text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed ? (
            <div className="space-y-2">
              <WhiteButton className="w-full text-sm font-medium">
                Settings
              </WhiteButton>
              <OrangeButton className="w-full text-sm font-medium">
                Logout
              </OrangeButton>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button className="p-2 rounded-lg hover:bg-[#F77124] text-gray-600 hover:text-white transition-colors duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="bg-white rounded-2xl shadow-sm h-full">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 