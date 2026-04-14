"use client";
import Container from "@/app/admin/components/ui/Container";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Star,
  Users,
  Calendar,
} from "lucide-react";
import { Instructor } from "@/types";
import { useInstructor } from "@/hooks/useInstructor";
import { useFormContext, Controller } from "react-hook-form";
import { InternshipFormData } from "@/types/internshipForm";

const Screen12 = () => {
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<InternshipFormData>();

  const {
    getInstructors,
    isLoading,
    error: hookError,
    clearError,
  } = useInstructor();

  const [instructors, setInstructors] = useState<Instructor[] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const mentorsValue = watch("mentors") || [];

  const [selectedInstructorIds, setSelectedInstructorIds] =
    useState<string[]>(mentorsValue);

  const [expandedInstructors, setExpandedInstructors] = useState<Set<string>>(
    new Set(),
  );

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (
      isMounted &&
      mentorsValue.length > 0 &&
      selectedInstructorIds.length === 0
    ) {
      setSelectedInstructorIds(mentorsValue);
    }
  }, [mentorsValue, isMounted, selectedInstructorIds.length]);

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
    setInstructors([]);
    setPage(1);
    setHasMore(true);
    clearError();
    loadInstructors(1, true);
  }, [searchDebounced]);

  const loadInstructors = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (isLoading) return;

      try {
        const result = await getInstructors({
          page: pageNum,
          limit: 10,
          search: searchDebounced,
        });

        if (result) {
          if (reset) {
            setInstructors(result.instructors);
          } else {
            setInstructors((prev) => [
              ...(prev || []),
              ...(result.instructors || []),
            ]);
          }

          setHasMore(
            result.instructors?.length === 10 &&
              (instructors?.length || 0) + (result.instructors?.length || 0) <
                result.total,
          );
          setPage(pageNum + 1);
        }
      } catch (error) {
        console.error("Error loading instructors:", error);
      }
    },
    [
      isLoading,
      searchDebounced,
      getInstructors,
      clearError,
      instructors?.length,
    ],
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight + 100 &&
        hasMore &&
        !isLoading
      ) {
        loadInstructors(page);
      }
    },
    [hasMore, isLoading, page, loadInstructors],
  );

  useEffect(() => {
    loadInstructors(1, true);
  }, []);

  const handleInstructorToggle = (instructorId: string) => {
    const newSelected = selectedInstructorIds.includes(instructorId)
      ? selectedInstructorIds.filter((id: string) => id !== instructorId)
      : [...selectedInstructorIds, instructorId];

    setSelectedInstructorIds(newSelected);
    setValue("mentors", newSelected, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const toggleInstructorExpansion = (instructorId: string) => {
    setExpandedInstructors((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(instructorId)) {
        newExpanded.delete(instructorId);
      } else {
        newExpanded.add(instructorId);
      }
      return newExpanded;
    });
  };

  if (!isMounted) {
    return (
      <Container
        title="Internship Mentor Selection (Screen 12)"
        description="Select mentors for your internship"
        className="h-full w-full max-h-full overflow-hidden flex flex-col"
        classNameBody="flex flex-col gap-4"
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Loading mentors...
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Internship Mentor Selection (Screen 12)"
      description="Select mentors for your internship"
      className="h-full w-full max-h-full overflow-hidden flex flex-col"
      classNameBody="flex flex-col gap-4"
    >
      <div className="bg-linear-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-purple-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Internship Mentors <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600">
                Select mentors for your internship (
                {selectedInstructorIds.length} selected)
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
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            placeholder="Search mentors by name, position, or company..."
          />
        </div>
      </div>

      {errors.mentors && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="text-red-800 font-semibold">Validation Error</h4>
              <p className="text-red-700 text-sm">
                {String(errors.mentors?.message || "")}
              </p>
            </div>
          </div>
        </div>
      )}

      {hookError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="text-red-800 font-semibold">Error</h4>
              <p className="text-red-700 text-sm">{hookError}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto space-y-4 pr-2"
        onScroll={handleScroll}
        style={{ scrollbarWidth: "thin" }}
      >
        {instructors?.map((instructor) => {
          if (!instructor._id) return null;

          const isSelected = selectedInstructorIds.includes(instructor._id);
          const isExpanded = expandedInstructors.has(instructor._id);

          return (
            <div
              key={instructor._id}
              className={`border rounded-xl p-4 transition-all cursor-pointer ${
                isSelected
                  ? "border-purple-500 bg-purple-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      instructor._id && handleInstructorToggle(instructor._id)
                    }
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                          {instructor.profilePicture ? (
                            <img
                              src={instructor.profilePicture}
                              alt={`${instructor.firstName} ${instructor.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-purple-600 font-bold text-base">
                              {`${instructor.firstName} ${instructor.lastName}`
                                .split(" ")
                                .map((word) => word.charAt(0).toUpperCase())
                                .slice(0, 2)
                                .join("")}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {instructor.firstName} {instructor.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {instructor.email}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        {instructor.currentPosition && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{instructor.currentPosition}</span>
                            {instructor.currentCompany && (
                              <span>at {instructor.currentCompany}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{instructor.rating || 0}/5</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span>
                              {instructor.totalStudents || 0} students
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && instructor.bio && (
                        <div className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {instructor.bio}
                        </div>
                      )}

                      {isExpanded &&
                        instructor.previousExperience &&
                        instructor.previousExperience.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-800 mb-2">
                              Experience:
                            </h5>
                            <div className="space-y-1">
                              {instructor.previousExperience
                                .slice(0, 2)
                                .map((exp, index) => (
                                  <div
                                    key={index}
                                    className="text-sm text-gray-600"
                                  >
                                    <span className="font-medium">
                                      {exp.position}
                                    </span>{" "}
                                    at {exp.companyName}
                                  </div>
                                ))}
                              {instructor.previousExperience.length > 2 && (
                                <div className="text-sm text-gray-500">
                                  +{instructor.previousExperience.length - 2}{" "}
                                  more experiences
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {instructor.linkedinUrl && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                          <span>LinkedIn: </span>
                          <a
                            href={instructor.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Profile
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Joined:{" "}
                          {new Date(instructor.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          instructor._id &&
                            toggleInstructorExpansion(instructor._id);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2 mt-3 text-purple-600 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Selected as mentor for this internship
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
              <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
              Loading mentors...
            </div>
          </div>
        )}

        {!hasMore && instructors && instructors.length > 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No more mentors to load
          </div>
        )}

        {instructors?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No mentors found" : "No mentors available"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No mentors are currently available"}
            </p>
          </div>
        )}

        <Controller
          name="mentors"
          control={control}
          rules={{ required: "At least one mentor is required" }}
          render={({ field }) => (
            <input type="hidden" {...field} value={selectedInstructorIds} />
          )}
        />
      </div>
    </Container>
  );
};

export default Screen12;
