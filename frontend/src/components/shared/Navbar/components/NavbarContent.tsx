"use client";
import Error from "@/components/ui/Error";
import ImageComponent from "@/components/ui/ImageComponent";
import { ENDPOINTS } from "@/constants/endpoints";
import { cn, fetcher } from "@/lib/utils";
import { Course, NavItem, Category } from "@/types";
import { AlertCircle, ChevronRight, Crown, ArrowLeft } from "lucide-react";
import Loader from "@/components/ui/Loader";
import Link from "next/link";
import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useCategory } from "@/hooks/useCategory";

const NavbarContent = ({
  navLink,
  closeHoverContainer,
}: {
  navLink: NavItem;
  closeHoverContainer: () => void;
}) => {
  const { getActiveCategories } = useCategory();

  const audiences = [
    {
      label: "College Students",
      value: "college-students",
    },
    {
      label: "Working Professionals",
      value: "professionals",
    },
  ];
  const [selectedAudience, setSelectedAudience] = useState<string>(
    audiences[0].value,
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [allCategoriesCache, setAllCategoriesCache] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryHasMore, setCategoryHasMore] = useState(true);
  const [isLoadingMoreCategories, setIsLoadingMoreCategories] = useState(false);
  const [page, setPage] = useState(1);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCategory(null);
  }, [selectedAudience]);

  // Fetch all categories once (no audience filter); filter client-side when audience changes
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      if (!categoryHasMore && categoryPage > 1) return;
      setIsLoadingCategories(categoryPage === 1);
      if (categoryPage > 1) setIsLoadingMoreCategories(true);
      try {
        const response = await getActiveCategories({
          page: categoryPage,
        });
        if (cancelled) return;
        if (response?.categories) {
          const newCats = response.categories;
          const totalPages = response.totalPages ?? 1;
          const responsePage = response.page ?? categoryPage;
          // Only apply if this response is for the page we requested (avoid out-of-order updates)
          if (responsePage !== categoryPage) return;

          setAllCategoriesCache((prev) =>
            responsePage === 1 ? newCats : [...prev, ...newCats],
          );
          setCategoryHasMore(responsePage < totalPages);
        }
      } catch (error) {
        if (!cancelled) console.error("Failed to fetch categories:", error);
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false);
          setIsLoadingMoreCategories(false);
        }
      }
    };

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, [categoryPage, categoryHasMore, getActiveCategories]);

  // Filter categories by selected audience (no API call)
  const categories = allCategoriesCache.filter(
    (c) =>
      c.audience === selectedAudience ||
      (!c.audience && selectedAudience === "college-students"),
  );

  // Reset courses state when audience or category changes
  useEffect(() => {
    setPage(1);
    setAllCourses([]);
    setHasMore(true);
  }, [selectedAudience, selectedCategory]);

  // Stable SWR key: only fetch when we have a valid category with _id
  const coursesSwrKey = useMemo(() => {
    if (!selectedCategory?._id) return null;
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", "10");
    params.append("audience", selectedAudience);
    params.append("categories", selectedCategory._id);
    return `${ENDPOINTS.courses.all}?${params.toString()}`;
  }, [selectedCategory?._id, selectedAudience, page]);

  const { data, isLoading, error } = useSWR(coursesSwrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    revalidateTags: ["Course"],
    dedupingInterval: 1000 * 60 * 5, // 5 minutes
  });

  // Update courses when data changes (handle both object and empty-array API shapes)
  useEffect(() => {
    if (!coursesSwrKey) return;
    const payload = data?.data?.data ?? data?.data;
    if (payload == null) return;

    const isPayloadArray = Array.isArray(payload);
    const newCourses = isPayloadArray
      ? []
      : (payload.courses && Array.isArray(payload.courses) ? payload.courses : []);
    const totalPages = isPayloadArray ? 1 : (payload.totalPages ?? 1);
    const currentPage = isPayloadArray ? 1 : (payload.page ?? 1);

    if (currentPage !== page) return;

    if (currentPage === 1) {
      setAllCourses(newCourses);
    } else {
      setAllCourses((prev) => [...prev, ...newCourses]);
    }
    setHasMore(currentPage < totalPages);
    setIsLoadingMore(false);
  }, [data, page, coursesSwrKey]);

  // Load more courses
  const loadMoreCourses = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore]);

  const loadMoreCategories = useCallback(() => {
    if (!isLoadingMoreCategories && categoryHasMore) {
      setIsLoadingMoreCategories(true);
      setCategoryPage((prev) => prev + 1);
    }
  }, [isLoadingMoreCategories, categoryHasMore]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

    if (isNearBottom) {
      if (selectedCategory) {
        if (hasMore && !isLoadingMore) {
          loadMoreCourses();
        }
      } else {
        if (
          categoryHasMore &&
          !isLoadingMoreCategories &&
          !isLoadingCategories
        ) {
          loadMoreCategories();
        }
      }
    }
  }, [
    hasMore,
    isLoadingMore,
    loadMoreCourses,
    selectedCategory,
    categoryHasMore,
    isLoadingMoreCategories,
    isLoadingCategories,
    loadMoreCategories,
  ]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const renderCategories = (): React.ReactNode => {
    if (isLoadingCategories) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Loader size="lg" variant="spinner" />
        </div>
      );
    }

    if (categories.length === 0) {
      const audienceLabel =
        audiences.find((aud) => aud.value === selectedAudience)?.label || "All";
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg">
              No categories found for {audienceLabel}
            </p>
          </div>
        </div>
      );
    }

    const audienceLabel =
      audiences.find((aud) => aud.value === selectedAudience)?.label ||
      "Categories";
    const headingText = `${audienceLabel === "College Students" ? "Pick Your Learning Domain" : audienceLabel === "Working Professionals" ? "Select Your Career Specialisation" : "Categories"}`;

    return (
      <div className="w-full h-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{headingText}</h2>
          <p className="text-sm text-gray-500">
            {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"} available
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
          {categories.map((category: Category) => {
            return (
              <div
                key={category._id}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "w-full flex flex-row max-h-[100px] xl:max-h-[80px] items-center hover:bg-linear-to-tr from-orange-500/10 to-white gap-3 hover:bg-gray-100 transition-all duration-300 cursor-pointer rounded-xl p-1",
                )}
              >
                <div className="w-1/3 h-full shrink-0 relative">
                  {category.categoryImage && (
                    <ImageComponent
                      src={category.categoryImage}
                      alt={category.name || "Category"}
                      width={100}
                      height={100}
                      className="w-full h-full rounded-xl object-cover"
                      draggable={false}
                    />
                  )}
                </div>
                <div className="w-2/3 h-full flex flex-col gap-1 py-2">
                  <div className="w-full h-full flex flex-col gap-1 justify-between">
                    <h3 className="text-sm font-bold">{category.name}</h3>
                    {category.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCourses = (): React.ReactNode => {
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
        audiences.find((aud) => aud.value === selectedAudience)?.label || "All";
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span className="text-sm font-medium">Back to Categories</span>
          </button>
          <div className="text-center">
            <p className="text-gray-500 text-lg">
              No courses found in {selectedCategory?.name} for {audienceLabel}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h2 className="text-xl font-bold text-gray-800">
              {selectedCategory?.name || "Courses"}
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            {allCourses.length} {allCourses.length === 1 ? "course" : "courses"}
          </p>
        </div>
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
                    "w-full flex flex-row max-h-[100px] xl:max-h-[80px] items-center hover:bg-linear-to-tr from-orange-500/10 to-white gap-3 hover:bg-gray-100 transition-all duration-300 cursor-pointer rounded-xl",
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
      </div>
    );
  };

  const renderInternships = (): React.ReactNode => {
    return null;
  };

  return (
    <div className="bg-white w-full h-full flex gap-10">
      <div className="w-2/8 xl:w-1/5 flex flex-col gap-4 shrink-0 items-end">
        <h1 className="text-2xl font-bold text-black/60">Audience</h1>
        <div className="w-full flex flex-col gap-2 text-right">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className={cn(
                "category w-full px-8 py-4 flex items-center justify-between hover:bg-gray-200 transition-all duration-300 cursor-pointer rounded-xl shrink-0",
                selectedAudience === audience.value && "bg-gray-200",
              )}
              onMouseEnter={() => {
                setSelectedAudience(audience.value);
                setSelectedCategory(null); // Reset category when audience changes
              }}
            >
              <span className="text-base lg:text-lg font-normal wrap-break-word">
                {audience.label}
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
          {navLink?.label === "courses"
            ? selectedCategory
              ? renderCourses()
              : renderCategories()
            : renderInternships()}
        </Suspense>
      </div>
    </div>
  );
};

export default NavbarContent;
