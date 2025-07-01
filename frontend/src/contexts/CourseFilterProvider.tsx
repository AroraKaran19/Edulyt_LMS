"use client";
import React, { createContext, useContext, useState } from "react";

interface CourseFilterContextType {
  search: string;
  setSearch: (search: string) => void;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  selectedFilter: Filter[];
  setSelectedFilter: (selectedFilter: Filter[]) => void;
  handleFilterClick: (filter: Filter) => void;
}

interface Filter {
  label: string;
  value: string;
  featureBox?: {
    value: string;
  }
}

const CourseFilterContext = createContext<CourseFilterContextType | null>(null);

const CourseFilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filter[]>(
    [
      {
        label: "All",
        value: "all",
      },
      {
      label: "Data Science",
      value: "data-science",
      featureBox: {
        value: "100+",
      }
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
      }
    },
    {
      label: "Web Development",
      value: "web-development",
    },
  ]);
  const [selectedFilter, setSelectedFilter] = useState<{ label: string; value: string }[]>([
    {
      label: "All",
      value: "all",
    },
  ]);

  const handleFilterClick = (filter: Filter) => {
    if (filter.value === "all") {
      setSelectedFilter([filters[0]]);
    } else {
      const isCurrentlySelected = selectedFilter.some((f) => f.value === filter.value);
      
      if (isCurrentlySelected) {
        const newSelection = selectedFilter.filter((f) => f.value !== filter.value);
        setSelectedFilter(newSelection.length === 0 ? [filters[0]] : newSelection);
      } else {
        // If clicking on a new filter, add it and remove "All" if present
        const withoutAll = selectedFilter.filter((f) => f.value !== "all");
        setSelectedFilter([...withoutAll, filter]);
      }
    }
  };

  return (
    <CourseFilterContext.Provider
      value={{ search, setSearch, filters, setFilters, selectedFilter, setSelectedFilter, handleFilterClick }}
    >
      {children}
    </CourseFilterContext.Provider>
  );
};

export const useCourseFilter = () => {
  const context = useContext(CourseFilterContext);
  if (!context) {
    throw new Error(
      "useCourseFilter must be used within a CourseFilterProvider"
    );
  }
  return context;
};

export default CourseFilterProvider;
