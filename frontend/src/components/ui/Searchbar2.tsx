"use client";
import { Search } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const Searchbar2 = ({
  placeholder,
  value,
  onChange,
  onSearch,
  className,
  ...props
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  className?: string;
  props?: React.ComponentProps<"div">;
}) => {
  return (
    <div
      {...props}
      className={cn(
        "search-bar w-full relative bg-[#F5F5F5] px-3 py-2.5 rounded-2xl shadow-[inset_0_5px_2px_rgba(0,0,0,0.1)] border border-gray-300",
        className
      )}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full outline-none text-xs font-medium"
      />
      <div
        onClick={onSearch}
        className="search-icon absolute bg-gradient-to-b from-[#F5691D] to-[#F9792A] rounded-xl p-1.75 right-3 top-1/2 -translate-y-1/2 cursor-pointer active:shadow-[inset_0_2px_6px_rgba(255,255,255,0.8)]"
      >
        <Search className="size-4.5 text-white" />
      </div>
    </div>
  );
};

export default Searchbar2;
