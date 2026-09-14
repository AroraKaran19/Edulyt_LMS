"use client";
import Error from "@/components/ui/Error";
import ImageComponent from "@/components/ui/ImageComponent";
import { ENDPOINTS } from "@/constants/endpoints";
import { cn, fetcher } from "@/lib/utils";
import { Course, NavItem, Category } from "@/types";
import type { InternshipPublicListing } from "@/types/internship";
import { AlertCircle, Crown, ArrowLeft } from "lucide-react";
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

  // Airkrit sells college courses only, so there is no audience to choose.
  const audiences = [
    {
      label: "College Students",
      value: "college-students",
    },
  ];
  const selectedAudience = audiences[0].value;
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
  const prevNavLabelRef = useRef<string | null>(null);

  const [internshipPage, setInternshipPage] = useState(1);
  const [allInternships, setAllInternships] = useState<InternshipPublicListing[]>(
    [],
  );
  const [internshipHasMore, setInternshipHasMore] = useState(true);
  const [isLoadingMoreInternships, setIsLoadingMoreInternships] =
    useState(false);

  useEffect(() => {
    const prev = prevNavLabelRef.current;
    prevNavLabelRef.current = navLink?.label ?? null;
    if (navLink?.label === "internship" && prev !== "internship") {
      setInternshipPage(1);
      setAllInternships([]);
      setInternshipHasMore(true);
    }
  }, [navLink?.label]);

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

  const internshipsSwrKey = useMemo(() => {
    if (navLink?.label !== "internship") return null;
    const params = new URLSearchParams();
    params.append("page", internshipPage.toString());
    params.append("limit", "12");
    // Closed programs stay listed here too, flagged as not accepting registrations.
    params.append("includeClosed", "true");
    return `${ENDPOINTS.internships.all}?${params.toString()}`;
  }, [navLink?.label, internshipPage]);

  const {
    data: internshipSwrData,
    isLoading: internshipLoading,
    error: internshipError,
  } = useSWR(internshipsSwrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    dedupingInterval: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!internshipsSwrKey) return;
    const payload =
      internshipSwrData?.data?.data ?? internshipSwrData?.data;
    if (payload == null) return;

    const isPayloadArray = Array.isArray(payload);
    const newItems = isPayloadArray
      ? []
      : payload.internships && Array.isArray(payload.internships)
        ? (payload.internships as InternshipPublicListing[])
        : [];
    const totalPages = isPayloadArray ? 1 : (payload.totalPages ?? 1);
    const currentPage = isPayloadArray ? 1 : (payload.page ?? 1);

    if (currentPage !== internshipPage) return;

    if (currentPage === 1) {
      setAllInternships(newItems);
    } else {
      setAllInternships((prev) => [...prev, ...newItems]);
    }
    setInternshipHasMore(currentPage < totalPages);
    setIsLoadingMoreInternships(false);
  }, [internshipSwrData, internshipPage, internshipsSwrKey]);

  // Load more courses
  const loadMoreCourses = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore]);

  const loadMoreInternships = useCallback(() => {
    if (!isLoadingMoreInternships && internshipHasMore) {
      setIsLoadingMoreInternships(true);
      setInternshipPage((p) => p + 1);
    }
  }, [isLoadingMoreInternships, internshipHasMore]);

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

    if (!isNearBottom) return;

    if (navLink?.label === "internship") {
      if (
        internshipHasMore &&
        !isLoadingMoreInternships &&
        !internshipLoading
      ) {
        loadMoreInternships();
      }
      return;
    }

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
  }, [
    navLink?.label,
    internshipHasMore,
    isLoadingMoreInternships,
    internshipLoading,
    loadMoreInternships,
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
              No programs found in {selectedCategory?.name} for {audienceLabel}
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
              {selectedCategory?.name || "Programs"}
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            {allCourses.length} {allCourses.length === 1 ? "program" : "programs"}
          </p>
        </div>
        <div className="w-full h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
            {allCourses.map((course: Course, index: number) => {
              return (
                <Link
                  key={index}
                  href={`/programs/${course.slug}`}
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
                text="Loading more programs..."
                showText={true}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInternships = (): React.ReactNode => {
    if (internshipError) {
      return (
        <Error
          icon={AlertCircle}
          iconSize="lg"
          iconColor="text-red-500"
          title="Error"
          description={
            (internshipError as Error)?.message ?? "Could not load internships"
          }
          containerHeight="h-64"
        />
      );
    }

    if (internshipLoading && allInternships.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Loader size="lg" variant="spinner" />
        </div>
      );
    }

    if (!internshipLoading && allInternships.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500 text-lg">No internships available</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Internships</h2>
          <p className="text-sm text-gray-500">
            {allInternships.length}{" "}
            {allInternships.length === 1 ? "program" : "programs"} shown
          </p>
        </div>
        <div className="w-full h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
            {allInternships.map((item) => {
              const closed = item.isActive === false;
              return (
              <Link
                key={item._id ?? item.slug}
                href={`/internships/${item.slug}`}
                onClick={() => {
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
                  <ImageComponent
                    src={item.thumbnail || "/CourseCardDemo.jpg"}
                    alt={item.title || "Internship"}
                    width={100}
                    height={100}
                    className={cn(
                      "w-full h-full rounded-xl object-cover",
                      closed && "grayscale",
                    )}
                    draggable={false}
                  />
                </div>
                <div className="w-2/3 h-full flex flex-col gap-1 py-2">
                  <h3 className="text-sm font-bold line-clamp-2">{item.title}</h3>
                  {closed && (
                    <span className="text-[11px] font-bold text-stone-500">
                      Enrollments are closed!
                    </span>
                  )}
                </div>
              </Link>
              );
            })}
          </div>

          {isLoadingMoreInternships && (
            <div className="w-full flex items-center justify-center py-4">
              <Loader
                size="md"
                variant="spinner"
                text="Loading more…"
                showText={true}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white w-full h-full flex gap-10">
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 min-w-0 h-full overflow-y-auto scroll-smooth",
          navLink?.label === "internship" && "w-full",
        )}
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
            : navLink?.label === "internship"
              ? renderInternships()
              : null}
        </Suspense>
      </div>
    </div>
  );
};

export default NavbarContent;
