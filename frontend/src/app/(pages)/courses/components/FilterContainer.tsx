import { cn } from "@/lib/utils";
import { Filter } from "@/types";

const FilterContainer = ({
  filters,
  selectedFilter,
  isMobile,
  handleFilterClick,
}: {
  filters: Filter[];
  selectedFilter: Filter[];
  isMobile: boolean;
  handleFilterClick: (filter: Filter) => void;
}) => {
  return (
    <div
      className={`filter-options w-full mt-6 bg-[#fff6f1] rounded-full flex gap-2 items-stretch animate-fade-from-top p-2 ${
        isMobile ? "overflow-scroll" : "overflow-x-auto"
      }`}
    >
      {filters.map((filter, index) => (
        <div
          key={index}
          className={cn(
            `filter-option text-[16px] py-2 px-4 font-bold text-text-primary rounded-full select-none cursor-pointer text-center flex gap-2 items-center justify-center`,
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
          <span className="text-sm py-2">{filter.label}</span>
          {filter.featureBox && (
            <span className="text-[10px] font-normal px-1.5 py-0.75 rounded-full bg-[#F5691D] text-white">
              {filter.featureBox.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default FilterContainer;
