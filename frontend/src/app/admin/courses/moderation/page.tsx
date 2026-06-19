"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import {
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  Reply,
  Loader2,
  Trash2,
} from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { Review } from "@/types/review";
import { QnA, QnAReply } from "@/types/qna";
import Image from "next/image";

type TabType = "reviews" | "qna";
type FilterType = "pending" | "approved" | "all";

const ModerationPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("reviews");
  const [filterType, setFilterType] = useState<FilterType>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedQnAs, setExpandedQnAs] = useState<Set<string>>(new Set());

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);

  // QnA state
  const [qnas, setQnas] = useState<QnA[]>([]);
  const [qnasTotal, setQnasTotal] = useState(0);

  // Image error tracking
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    if (name.includes("@")) {
      const username = name.split("@")[0];
      return username.substring(0, 2).toUpperCase();
    }
    if (name.toLowerCase().includes("anonymous")) {
      return "AU";
    }
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper function to generate a consistent color based on name
  const getAvatarColor = (name: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Toggle Q&A replies expansion
  const toggleQnAExpansion = (qnaId: string) => {
    setExpandedQnAs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(qnaId)) {
        newSet.delete(qnaId);
      } else {
        newSet.add(qnaId);
      }
      return newSet;
    });
  };

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (filterType !== "all") {
        params.approved = filterType === "approved";
      }

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await apiClient.get("/reviews", { params });
      setReviews(response.data.data.reviews || []);
      setReviewsTotal(response.data.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  }, [filterType, debouncedSearch]);

  // Fetch Q&As
  const fetchQnAs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (filterType !== "all") {
        params.approved = filterType === "approved";
      }

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await apiClient.get("/qna", { params });
      setQnas(response.data.data.qnas || []);
      setQnasTotal(response.data.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch Q&As:", error);
      toast.error("Failed to load Q&As");
    } finally {
      setIsLoading(false);
    }
  }, [filterType, debouncedSearch]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchReviews();
    } else {
      fetchQnAs();
    }
  }, [activeTab, filterType, debouncedSearch, fetchReviews, fetchQnAs]);

  // Approve review
  const approveReview = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.patch(`/reviews/admin/${id}/approve`);
      toast.success("Review approved successfully");
      fetchReviews();
    } catch (error) {
      console.error("Failed to approve review:", error);
      toast.error("Failed to approve review");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject review
  const rejectReview = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.patch(`/reviews/admin/${id}/reject`);
      toast.success("Review rejected successfully");
      fetchReviews();
    } catch (error) {
      console.error("Failed to reject review:", error);
      toast.error("Failed to reject review");
    } finally {
      setProcessingId(null);
    }
  };

  // Delete review
  const deleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;
    setProcessingId(id);
    try {
      await apiClient.delete(`/reviews/admin/${id}`);
      toast.success("Review deleted successfully");
      fetchReviews();
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    } finally {
      setProcessingId(null);
    }
  };

  // Approve Q&A
  const approveQnA = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.patch(`/qna/admin/${id}/approve`);
      toast.success("Q&A approved successfully");
      fetchQnAs();
    } catch (error) {
      console.error("Failed to approve Q&A:", error);
      toast.error("Failed to approve Q&A");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject Q&A
  const rejectQnA = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.patch(`/qna/admin/${id}/reject`);
      toast.success("Q&A rejected successfully");
      fetchQnAs();
    } catch (error) {
      console.error("Failed to reject Q&A:", error);
      toast.error("Failed to reject Q&A");
    } finally {
      setProcessingId(null);
    }
  };

  // Delete Q&A
  const deleteQnA = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Q&A? This action cannot be undone.")) return;
    setProcessingId(id);
    try {
      await apiClient.delete(`/qna/admin/${id}`);
      toast.success("Q&A deleted successfully");
      fetchQnAs();
    } catch (error) {
      console.error("Failed to delete Q&A:", error);
      toast.error("Failed to delete Q&A");
    } finally {
      setProcessingId(null);
    }
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get user display name
  const getUserDisplayName = (user: any): string => {
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ""}`.trim();
    }
    return user?.email || "Anonymous User";
  };

  // Get name for initials (prioritize actual names)
  const getNameForInitials = (user: any): string => {
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ""}`.trim();
    }
    return "Anonymous User";
  };

  // Get course info from QnA for display
  const getQnACourseDisplay = (qna: {
    courseId: { title?: string; slug?: string } | string;
  }): { title: string; slug?: string } => {
    const course = qna.courseId;
    if (typeof course === "object" && course) {
      return {
        title: course.title || "Unknown Course",
        slug: course.slug,
      };
    }
    return { title: "Course" };
  };

  // Get course/instructor name from review for display
  const getReviewableDisplay = (review: {
    reviewableType: string;
    reviewableId: { title?: string; name?: string; slug?: string } | string;
  }): { label: string; title: string; slug?: string } => {
    const ref = review.reviewableId;
    if (typeof ref === "object" && ref) {
      if (review.reviewableType === "Course") {
        return {
          label: "Course",
          title: ref.title || "Unknown Course",
          slug: ref.slug,
        };
      }
      return {
        label: "Instructor",
        title: ref.name || "Unknown Instructor",
      };
    }
    return {
      label: review.reviewableType,
      title: review.reviewableType === "Course" ? "Course" : "Instructor",
    };
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getPendingCount = () => {
    if (activeTab === "reviews") {
      return reviews.filter((r) => !r.approved).length;
    }
    return qnas.filter((q) => !q.approved).length;
  };

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Content Moderation
              </h1>
              <p className="text-gray-600 mt-1">
                Review and approve user-generated content
              </p>
            </div>
          </div>
          {getPendingCount() > 0 && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800">
                <span className="font-semibold">{getPendingCount()}</span>{" "}
                {activeTab === "reviews" ? "review" : "question"}
                {getPendingCount() !== 1 ? "s" : ""} awaiting your review
              </p>
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="bg-linear-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab("reviews");
                  setFilterType("pending");
                }}
                className={`flex-1 flex items-center justify-center cursor-pointer gap-3 px-6 py-4 font-semibold transition-all duration-200 relative ${
                  activeTab === "reviews"
                    ? "text-orange-600 bg-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Star className="w-5 h-5" />
                <span>Reviews</span>
                {reviewsTotal > 0 && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      activeTab === "reviews"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {reviewsTotal}
                  </span>
                )}
                {activeTab === "reviews" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-orange-500 to-orange-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("qna");
                  setFilterType("pending");
                }}
                className={`flex-1 flex items-center justify-center cursor-pointer gap-3 px-6 py-4 font-semibold transition-all duration-200 relative ${
                  activeTab === "qna"
                    ? "text-orange-600 bg-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Q&A</span>
                {qnasTotal > 0 && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      activeTab === "qna"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {qnasTotal}
                  </span>
                )}
                {activeTab === "qna" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-orange-500 to-orange-600" />
                )}
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType("pending")}
                  className={`flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    filterType === "pending"
                      ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Pending
                </button>
                <button
                  onClick={() => setFilterType("approved")}
                  className={`flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    filterType === "approved"
                      ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Approved
                </button>
                <button
                  onClick={() => setFilterType("all")}
                  className={`flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    filterType === "all"
                      ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  All
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={`Search ${
                    activeTab === "reviews" ? "reviews" : "questions"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-shadow shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 min-h-[500px]">
            {/* Loading State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-600">Loading content...</p>
              </div>
            ) : (
              <>
                {/* Reviews Content */}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                        <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No reviews found
                        </h3>
                        <p className="text-gray-600">
                          {filterType === "pending"
                            ? "All reviews have been reviewed"
                            : searchTerm
                              ? "Try adjusting your search terms"
                              : "No reviews match your criteria"}
                        </p>
                      </div>
                    ) : (
                      reviews.map((review) => {
                        const userName = getUserDisplayName(review.userId);
                        const nameForInitials = getNameForInitials(
                          review.userId,
                        );
                        const reviewableInfo = getReviewableDisplay(review);
                        const userAvatar =
                          typeof review.userId === "object" &&
                          review.userId?.profilePicture
                            ? review.userId.profilePicture
                            : "";

                        return (
                          <div
                            key={review._id}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-orange-200"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              {/* User Avatar */}
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0 ring-2 ring-gray-100">
                                {userAvatar &&
                                !imageErrors[review._id || ""] ? (
                                  <Image
                                    src={userAvatar}
                                    alt={userName}
                                    className="w-full h-full object-cover"
                                    width={48}
                                    height={48}
                                    onError={() =>
                                      handleImageError(review._id || "")
                                    }
                                  />
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                                      nameForInitials,
                                    )}`}
                                  >
                                    {getInitials(nameForInitials)}
                                  </div>
                                )}
                              </div>

                              {/* Review Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-900">
                                      {userName}
                                    </span>
                                    {renderStars(review.rating)}
                                  </div>
                                  {/* Status Badge */}
                                  {review.approved ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                      <CheckCircle className="w-4 h-4" />
                                      Approved
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                                      <Clock className="w-4 h-4" />
                                      Pending
                                    </span>
                                  )}
                                </div>

                                <p className="text-gray-700 mb-3 leading-relaxed">
                                  {review.comment}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(review.createdAt || new Date())}
                                  </div>
                                  <div className="flex items-center gap-1.5" title={reviewableInfo.title}>
                                    <BookOpen className="w-4 h-4 shrink-0" />
                                    <span className="font-medium text-gray-700">
                                      {reviewableInfo.label}: {reviewableInfo.title}
                                    </span>
                                    {reviewableInfo.slug && (
                                      <a
                                        href={`/programs/${reviewableInfo.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-600 hover:text-orange-700 hover:underline ml-1"
                                      >
                                        View course →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                              {!review.approved ? (
                                <>
                                  <button
                                    onClick={() =>
                                      approveReview(review._id || "")
                                    }
                                    disabled={processingId === review._id}
                                    className="flex items-center cursor-pointer justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-green-200"
                                  >
                                    {processingId === review._id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      rejectReview(review._id || "")
                                    }
                                    disabled={processingId === review._id}
                                    className="flex items-center justify-center cursor-pointer gap-2 px-4 py-2.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-red-200"
                                  >
                                    {processingId === review._id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => rejectReview(review._id || "")}
                                  disabled={processingId === review._id}
                                  className="flex items-center justify-center cursor-pointer gap-2 px-4 py-2.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-red-200"
                                >
                                  {processingId === review._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                  Unapprove
                                </button>
                              )}
                              <button
                                onClick={() => deleteReview(review._id || "")}
                                disabled={processingId === review._id}
                                className="flex items-center justify-center cursor-pointer gap-2 px-4 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-300 hover:border-red-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                {processingId === review._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Q&A Content */}
                {activeTab === "qna" && (
                  <div className="space-y-4">
                    {qnas.length === 0 ? (
                      <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Q&As found
                        </h3>
                        <p className="text-gray-600">
                          {filterType === "pending"
                            ? "All Q&As have been reviewed"
                            : searchTerm
                              ? "Try adjusting your search terms"
                              : "No Q&As match your criteria"}
                        </p>
                      </div>
                    ) : (
                      qnas.map((qna) => {
                        const userName = getUserDisplayName(qna.userId);
                        const nameForInitials = getNameForInitials(qna.userId);
                        const courseInfo = getQnACourseDisplay(qna);
                        const userAvatar =
                          typeof qna.userId === "object" &&
                          qna.userId?.profilePicture
                            ? qna.userId.profilePicture
                            : "";
                        const isExpanded = expandedQnAs.has(qna._id || "");
                        const hasReplies =
                          qna.replies && qna.replies.length > 0;

                        return (
                          <div
                            key={qna._id}
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-orange-200"
                          >
                            <div className="p-6">
                              <div className="flex items-start gap-4 mb-4">
                                {/* User Avatar */}
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0 ring-2 ring-gray-100">
                                  {userAvatar && !imageErrors[qna._id || ""] ? (
                                    <Image
                                      src={userAvatar}
                                      alt={userName}
                                      className="w-full h-full object-cover"
                                      width={48}
                                      height={48}
                                      onError={() =>
                                        handleImageError(qna._id || "")
                                      }
                                    />
                                  ) : (
                                    <div
                                      className={`w-full h-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                                        nameForInitials,
                                      )}`}
                                    >
                                      {getInitials(nameForInitials)}
                                    </div>
                                  )}
                                </div>

                                {/* Q&A Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                    <span className="font-semibold text-gray-900">
                                      {userName}
                                    </span>
                                    {/* Status Badge */}
                                    {qna.approved ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                        <CheckCircle className="w-4 h-4" />
                                        Approved
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                                        <Clock className="w-4 h-4" />
                                        Pending
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="font-semibold text-gray-900 mb-2 text-lg leading-snug">
                                    {qna.message}
                                  </h3>

                                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-4 h-4" />
                                      {formatDate(qna.createdAt || new Date())}
                                    </div>
                                    <div className="flex items-center gap-1.5" title={courseInfo.title}>
                                      <BookOpen className="w-4 h-4 shrink-0" />
                                      <span className="font-medium text-gray-700">
                                        Course: {courseInfo.title}
                                      </span>
                                      {courseInfo.slug && (
                                        <a
                                          href={`/programs/${courseInfo.slug}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-orange-600 hover:text-orange-700 hover:underline ml-1"
                                        >
                                          View course →
                                        </a>
                                      )}
                                    </div>
                                    {hasReplies && (
                                      <div className="flex items-center gap-1.5">
                                        <Reply className="w-4 h-4" />
                                        {qna.replies.length}{" "}
                                        {qna.replies.length === 1
                                          ? "reply"
                                          : "replies"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                                {!qna.approved ? (
                                  <>
                                    <button
                                      onClick={() => approveQnA(qna._id || "")}
                                      disabled={processingId === qna._id}
                                      className="flex items-center justify-center cursor-pointer gap-2 px-4 py-2.5 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-green-200"
                                    >
                                      {processingId === qna._id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4" />
                                      )}
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => rejectQnA(qna._id || "")}
                                      disabled={processingId === qna._id}
                                      className="flex items-center justify-center cursor-pointer gap-2 px-4 py-2.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-red-200"
                                    >
                                      {processingId === qna._id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <XCircle className="w-4 h-4" />
                                      )}
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => rejectQnA(qna._id || "")}
                                    disabled={processingId === qna._id}
                                    className="flex items-center justify-center cursor-pointer gap-2 px-4 py-2.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-red-200"
                                  >
                                    {processingId === qna._id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )}
                                    Unapprove
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteQnA(qna._id || "")}
                                  disabled={processingId === qna._id}
                                  className="flex items-center justify-center cursor-pointer gap-2 px-4 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-300 hover:border-red-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                  {processingId === qna._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                  Delete
                                </button>
                                {hasReplies && (
                                  <button
                                    onClick={() =>
                                      toggleQnAExpansion(qna._id || "")
                                    }
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-4 h-4" />
                                        Hide Replies
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4" />
                                        View Replies ({qna.replies.length})
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Replies Section */}
                            {hasReplies && isExpanded && (
                              <div className="bg-linear-to-br from-gray-50 to-white border-t border-gray-200 p-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                  <Reply className="w-4 h-4" />
                                  Replies ({qna.replies.length})
                                </h4>
                                <div className="space-y-4">
                                  {qna.replies.map(
                                    (reply: QnAReply, idx: number) => {
                                      const replyUserName = getUserDisplayName(
                                        reply.userId,
                                      );
                                      const replyNameForInitials =
                                        getNameForInitials(reply.userId);
                                      const replyUserAvatar =
                                        typeof reply.userId === "object" &&
                                        reply.userId?.profilePicture
                                          ? reply.userId.profilePicture
                                          : "";

                                      return (
                                        <div
                                          key={reply._id || idx}
                                          className="flex items-start gap-3 bg-white rounded-lg p-4 border border-gray-200"
                                        >
                                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                            {replyUserAvatar &&
                                            !imageErrors[reply._id || ""] ? (
                                              <Image
                                                src={replyUserAvatar}
                                                alt={replyUserName}
                                                className="w-full h-full object-cover"
                                                width={40}
                                                height={40}
                                                onError={() =>
                                                  handleImageError(
                                                    reply._id || "",
                                                  )
                                                }
                                              />
                                            ) : (
                                              <div
                                                className={`w-full h-full flex items-center justify-center text-white font-semibold text-xs ${getAvatarColor(
                                                  replyNameForInitials,
                                                )}`}
                                              >
                                                {getInitials(
                                                  replyNameForInitials,
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-semibold text-sm text-gray-900">
                                                {replyUserName}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {formatDate(
                                                  reply.createdAt || new Date(),
                                                )}
                                              </span>
                                            </div>
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                              {reply.message}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationPage;
