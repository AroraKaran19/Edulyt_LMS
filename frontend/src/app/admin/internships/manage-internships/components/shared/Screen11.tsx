"use client";
import Container from "@/app/admin/components/ui/Container";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Check,
  Users,
} from "lucide-react";
import { Testimonial } from "@/types";
import { useTestimonial } from "@/hooks/useTestimonial";
import { useFormContext } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";

const Screen11 = () => {
  const { setValue, watch } = useFormContext<InternshipFormData>();

  const {
    getTestimonials,
    isLoading,
    clearError,
  } = useTestimonial();

  const [testimonials, setTestimonials] = useState<Testimonial[] | null>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const testimonialsValue = watch("testimonials") || [];
  const [selectedTestimonialIds, setSelectedTestimonialIds] =
    useState<string[]>(testimonialsValue);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (
      isMounted &&
      testimonialsValue.length > 0 &&
      selectedTestimonialIds.length === 0
    ) {
      setSelectedTestimonialIds(testimonialsValue);
    }
  }, [testimonialsValue, isMounted, selectedTestimonialIds.length]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setTestimonials([]);
    setPage(1);
    setHasMore(true);
    clearError();
    loadTestimonials(1, true);
  }, [searchDebounced]);

  const loadTestimonials = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (isLoading) return;

      try {
        const result = await getTestimonials({
          page: pageNum,
          limit: 10,
          search: searchDebounced,
        });

        if (result) {
          if (reset) {
            setTestimonials(result.testimonials);
          } else {
            setTestimonials((prev) => [
              ...(prev || []),
              ...(result.testimonials || []),
            ]);
          }

          setHasMore(
            result.testimonials?.length === 10 &&
              (testimonials?.length || 0) + (result.testimonials?.length || 0) <
                result.total
          );
          setPage(pageNum + 1);
        }
      } catch (error) {
        console.error("Error loading testimonials:", error);
      }
    },
    [isLoading, searchDebounced, getTestimonials, clearError, testimonials?.length]
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight + 100 &&
        hasMore &&
        !isLoading
      ) {
        loadTestimonials(page);
      }
    },
    [hasMore, isLoading, page, loadTestimonials]
  );

  useEffect(() => {
    loadTestimonials(1, true);
  }, []);

  const handleTestimonialToggle = (testimonialId: string) => {
    const newSelected = selectedTestimonialIds.includes(testimonialId)
      ? selectedTestimonialIds.filter((id: string) => id !== testimonialId)
      : [...selectedTestimonialIds, testimonialId];

    setSelectedTestimonialIds(newSelected);
    setValue("testimonials", newSelected, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  if (!isMounted) {
    return (
      <Container
        title="Testimonials (Screen 11)"
        description="Select testimonials for your internship"
        icon={Users}
        className="h-full w-full max-h-full overflow-hidden flex flex-col"
        classNameBody="flex flex-col gap-4"
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Loading testimonials...
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Testimonials (Screen 11)"
      description="Select testimonials for your internship"
      icon={Users}
      className="h-full w-full max-h-full overflow-hidden flex flex-col"
      classNameBody="flex flex-col gap-4"
    >
      <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Student Testimonials
              </h3>
              <p className="text-sm text-gray-600">
                Select testimonials to showcase ({selectedTestimonialIds.length}{" "}
                selected)
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
            placeholder="Search testimonials by name, company, or college..."
          />
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto space-y-4 pr-2"
        onScroll={handleScroll}
        style={{ scrollbarWidth: "thin" }}
      >
        {testimonials?.map((testimonial) => {
          if (!testimonial._id) return null;

          const isSelected = selectedTestimonialIds.includes(testimonial._id);

          return (
            <div
              key={testimonial._id}
              className={`border rounded-xl p-4 transition-all cursor-pointer ${
                isSelected
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
              onClick={() =>
                testimonial._id && handleTestimonialToggle(testimonial._id)
              }
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      testimonial._id && handleTestimonialToggle(testimonial._id)
                    }
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    {testimonial.profileImage ? (
                      <img
                        src={testimonial.profileImage}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-base">
                          {testimonial.name
                            .split(" ")
                            .map((word) => word.charAt(0).toUpperCase())
                            .slice(0, 2)
                            .join("")}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {testimonial.currentRole} at {testimonial.currentCompany}
                      </p>
                    </div>
                  </div>

                  {testimonial.feedback && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {testimonial.feedback}
                    </p>
                  )}

                  {testimonial.college && (
                    <p className="text-xs text-gray-500">
                      From: {testimonial.college}
                    </p>
                  )}

                  {isSelected && (
                    <div className="flex items-center gap-2 mt-3 text-green-600 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Selected for this internship
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
              Loading testimonials...
            </div>
          </div>
        )}

        {!hasMore && testimonials && testimonials.length > 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No more testimonials to load
          </div>
        )}

        {testimonials?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No testimonials found" : "No testimonials available"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No internship testimonials are currently available"}
            </p>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Screen11;
