"use client";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";

interface InternshipSearchBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  onDebouncedSearch?: (search: string) => void;
  debounceDelay?: number;
}

const InternshipSearchBar = ({
  search,
  onSearchChange,
  onDebouncedSearch,
  debounceDelay = 500,
  ...props
}: InternshipSearchBarProps & {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const debouncedSearch = setTimeout(() => {
      if (onDebouncedSearch) {
        onDebouncedSearch(localSearch);
      }
    }, debounceDelay);

    return () => clearTimeout(debouncedSearch);
  }, [localSearch, onDebouncedSearch, debounceDelay]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearchChange(value);
  };

  return (
    <div
      className={cn(
        "courses-search-bar w-full bg-[#F5F5F5] p-4 shrink rounded-xl flex gap-2 items-center border border-black/10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]",
        props.className
      )}
    >
      <Search className="size-6 text-black/30" />
      <input
        type="text"
        placeholder="Search internship name by title or type"
        className="w-full h-full placeholder:text-black/30 bg-transparent outline-none"
        value={localSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
      />
    </div>
  );
};

export default InternshipSearchBar;
