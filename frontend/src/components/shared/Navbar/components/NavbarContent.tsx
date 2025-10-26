"use client";
import Error from "@/components/ui/Error";
import ImageComponent from "@/components/ui/ImageComponent";
import { ENDPOINTS } from "@/constants/endpoints";
import { cn, fetcher } from "@/lib/utils";
import { Course, NavItem } from "@/types";
import { AlertCircle, ChevronRight, Crown } from "lucide-react";
import Loader from "@/components/ui/Loader";
import Link from "next/link";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";

const NavbarContent = ({
  navLink,
  closeHoverContainer,
}: {
  navLink: NavItem;
  closeHoverContainer: () => void;
}) => {
  const categories = [
    {
      label: "All",
      value: "all",
    },
    {
      label: "College Students",
      value: "college-students",
    },
    {
      label: "Professionals",
      value: "professionals",
    },
  ];
  const [selectedAudience, setSelectedAudience] = useState<string>(
    categories[0].value
  );
  const [page, setPage] = useState(1);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when audience changes
  useEffect(() => {
    setPage(1);
    setAllCourses([]);
    setHasMore(true);
  }, [selectedAudience]);

  const { data, isLoading, error } = useSWR(
    `${ENDPOINTS.courses.all}?page=${page}&limit=10${
      selectedAudience === "all" ? "" : `&audience=${selectedAudience}`
    }`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: true,
      revalidateTags: ["Course"],
      dedupingInterval: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Update courses when data changes
  useEffect(() => {
    if (data?.data?.data) {
      const newCourses = data.data.data.courses || [];
      const totalPages = data.data.data.totalPages || 1;
      const currentPage = data.data.data.page || 1;

      // Only update if this is the current page we're expecting
      if (currentPage === page) {
        if (currentPage === 1) {
          setAllCourses(newCourses);
        } else {
          setAllCourses((prev) => [...prev, ...newCourses]);
        }

        setHasMore(currentPage < totalPages);
        setIsLoadingMore(false);
      }
    }
  }, [data, page]);

  // Load more courses
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

    if (isNearBottom && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const renderCouses = (): React.ReactNode => {
    if (error) {
      return (
        <Error
          icon={AlertCircle}
          iconSize="lg"
          iconColor="text-red-500"
          title="Error"
          description={error.message}
          containerHeight="h-64"
        />
      );
    }

    if (isLoading && allCourses.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Loader size="lg" variant="spinner" />
        </div>
      );
    }

    if (!isLoading && allCourses.length === 0) {
      const audienceLabel =
        categories.find((cat) => cat.value === selectedAudience)?.label ||
        "All";
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg">
              No courses found for {audienceLabel}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
          {allCourses.map((course: Course, index: number) => {
            return (
              <Link
                key={index}
                href={`/courses/${course.slug}`}
                onClick={() => {
                  // Close dropdown after a short delay to allow navigation
                  setTimeout(() => {
                    closeHoverContainer();
                  }, 150);
                }}
                className={cn(
                  "w-full flex flex-row max-h-[100px] xl:max-h-[80px] items-center hover:bg-linear-to-tr from-orange-500/10 to-white gap-3 hover:bg-gray-100 transition-all duration-300 cursor-pointer rounded-xl"
                )}
                draggable={false}
              >
                <div className="w-1/3 h-full shrink-0 relative">
                  {course.isFeatured && (
                    <div className="absolute top-1 left-1 flex flex-row items-center gap-1 bg-linear-to-tr from-black to-white/50 rounded-lg px-2 py-1">
                      <Crown className="size-3 text-yellow-500" />
                      <span className="text-xs text-white font-bold text-nowrap">
                        Featured
                      </span>
                    </div>
                  )}
                  <ImageComponent
                    src={course.thumbnail || "/CourseCardDemo.jpg"}
                    alt={course.title || "Course Thumbnail"}
                    width={100}
                    height={100}
                    className="w-full h-full rounded-xl"
                    draggable={false}
                  />
                </div>
                <div className="w-2/3 h-full flex flex-col gap-1 py-2">
                  <div className="w-full h-full flex flex-col gap-1 justify-between">
                    <h3 className="text-sm font-bold">{course.title}</h3>
                    <p
                      className="text-xs text-gray-500 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: course.description,
                      }}
                    ></p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="w-full flex items-center justify-center py-4">
            <Loader
              size="md"
              variant="spinner"
              text="Loading more courses..."
              showText={true}
            />
          </div>
        )}
      </div>
    );
  };

  const renderInternships = (): React.ReactNode => {
    return null;
  };

  return (
    <div className="bg-white w-full h-full flex gap-10">
      <div className="w-2/8 xl:w-1/5 flex flex-col gap-4 shrink-0 items-end">
        <h1 className="text-2xl font-bold text-black/60">Categories</h1>
        <div className="w-full flex flex-col gap-2 text-right">
          {categories.map((category, index) => (
            <div
              key={index}
              className={cn(
                "category w-full px-8 py-4 flex items-center justify-between hover:bg-gray-200 transition-all duration-300 cursor-pointer rounded-xl shrink-0",
                selectedAudience === category.value && "bg-gray-200"
              )}
              onClick={() => setSelectedAudience(category.value)}
            >
              <span className="text-base lg:text-lg font-normal wrap-break-word">
                {category.label}
              </span>
              <ChevronRight className="size-4 md:size-6 stroke-2 shrink-0" />
            </div>
          ))}
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Loader size="md" variant="spinner" />
            </div>
          }
        >
          {navLink?.label === "courses" ? renderCouses() : renderInternships()}
        </Suspense>
      </div>
    </div>
  );
};

export default NavbarContent;
