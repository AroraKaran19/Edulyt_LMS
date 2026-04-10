import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePartnerSidebar } from "../state/PartnerSidebarProvider";

export default function PartnerTopHeader() {
  const { toggleMobileSidebar } = usePartnerSidebar();

  return (
    <div className="w-full bg-white border-b border-black/5">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label="Open menu"
          className="lg:hidden cursor-pointer p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
        >
          <Menu className="size-6" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "hidden sm:flex items-center gap-2",
              "h-10 w-full max-w-[420px]",
              "bg-[#F8FAFC] border border-[#F2F4F7] rounded-xl px-3"
            )}
          >
            <Search className="size-4 text-[#667085]" />
            <input
              placeholder="Search"
              className="w-full bg-transparent outline-none text-sm text-[#1D2939] placeholder:text-[#667085]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 cursor-pointer items-center justify-center rounded-xl border border-[#F2F4F7] bg-white transition-colors hover:bg-gray-50"
          >
            <Bell className="size-5 text-[#475467]" />
            <span className="absolute -top-1 -right-1 size-5 rounded-lg bg-red-500 text-white text-[11px] font-semibold grid place-items-center">
              1
            </span>
          </button>

          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded-2xl px-2 py-1 transition-colors hover:bg-black/5"
          >
            <span className="size-9 rounded-xl bg-[#EEE7FF] text-[#6D28D9] font-semibold grid place-items-center">
              J
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#1D2939]">
              John Doe
              <ChevronDown
                className="size-4 shrink-0 text-[#98A2B3]"
                strokeWidth={2}
                aria-hidden
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
