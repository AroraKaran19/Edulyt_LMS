import React from 'react';
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

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  isHeader?: boolean;
};

interface SidebarProps {
  isCollapsed: boolean;
  activeMenu: string;
  showCourseContentDropdown: boolean;
  onToggleSidebar: () => void;
  onMenuClick: (menuId: string) => void;
  onScrollToSection: (sectionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  activeMenu,
  showCourseContentDropdown,
  onToggleSidebar,
  onMenuClick,
  onScrollToSection
}) => {
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

  const courseContentSections = [
    { id: "basic-info", label: "Basic Information", icon: <BookOpen className="w-4 h-4" /> },
    { id: "course-details", label: "Course Details", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "media", label: "Media", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { id: "pricing", label: "Pricing Plans", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg> },
    { id: "learning-outcomes", label: "Learning Outcomes", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
    { id: "course-features", label: "Course Features", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
    { id: "seo-settings", label: "SEO Settings", icon: <Search className="w-4 h-4" /> },
    { id: "course-modules", label: "Course Modules", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { id: "settings", label: "Settings", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  return (
    <div className={cn(
      "bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col border-r border-gray-200",
      isCollapsed ? "w-19" : "w-64"
    )}>
      {/* Sidebar Header */}
      <div className={cn(
        "px-4 border-b border-gray-200 flex items-center",
        isCollapsed ? "justify-center" : "justify-between"
      )} style={{ height: '84px' }}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#F77124]" />
            <h1 className="text-lg font-semibold text-gray-800">Admin Panel</h1>
          </div>
        )}
        <button
          onClick={onToggleSidebar}
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
              <div>
                <button
                  onClick={() => onMenuClick(item.id)}
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
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.id === "add-course" && (
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          showCourseContentDropdown && activeMenu === "add-course" ? "rotate-180" : ""
                        )} />
                      )}
                    </div>
                  )}
                </button>
                
                {/* Course Content Dropdown */}
                {item.id === "add-course" && showCourseContentDropdown && activeMenu === "add-course" && !isCollapsed && (
                  <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                    {courseContentSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => onScrollToSection(section.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left text-gray-600 hover:bg-gray-100 hover:text-[#F77124]"
                      >
                        {section.icon}
                        <span className="text-sm">{section.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
  );
};

export default Sidebar; 