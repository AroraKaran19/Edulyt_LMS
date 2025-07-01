"use client";
import { useCourseFilter } from "@/contexts/CourseFilterProvider";
import { Search } from "lucide-react";
import React, { useEffect } from "react";

const CourseSearchBar = () => {

	const { search, setSearch } = useCourseFilter();

	useEffect(() => {
		const debouncedSearch = setTimeout(() => {
			console.log(search);
		}, 500);

		return () => clearTimeout(debouncedSearch);
	}, [search]);

  return (
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
  );
};

export default CourseSearchBar;
