"use client";
import { Search } from "lucide-react";
import React, { useEffect, useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clean up any external styles that might be injected by browser extensions
    if (inputRef.current) {
      const input = inputRef.current;
      input.style.backgroundImage = "none";
      input.style.backgroundRepeat = "no-repeat";
      input.style.backgroundSize = "auto";
      input.style.backgroundPosition = "initial";
      input.removeAttribute("data-temp-mail-org");
    }
  }, []);

  return (
    <div
      {...props}
      className={cn(
        "search-bar w-full relative bg-[#F5F5F5] px-3 py-2.5 rounded-xl shadow-[inset_0_1px_1px_1px_rgba(0,0,0,0.1)] border border-gray-300",
        className
      )}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full outline-none text-xs font-medium bg-transparent"
        style={{
          backgroundImage: "none !important",
          backgroundRepeat: "no-repeat !important",
          backgroundSize: "auto !important",
          backgroundPosition: "initial !important",
        }}
        suppressHydrationWarning
      />
      <div
        onClick={onSearch}
        className="search-icon absolute bg-linear-to-b from-[#F5691D] to-[#F9792A] rounded-md p-1.75 right-3 top-1/2 -translate-y-1/2 cursor-pointer active:shadow-[inset_0_2px_6px_rgba(255,255,255,0.8)]"
      >
        <Search className="size-4.5 text-white" />
      </div>
    </div>
  );
};

export default Searchbar2;
