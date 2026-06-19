import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import React, { useState, useEffect, useCallback } from "react";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import {
  Plus,
  Search,
  HelpCircle,
  Check,
  X,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FAQ } from "@/types";
import { useFAQ } from "@/hooks/useFAQ";
import { useFormContext, Controller } from "react-hook-form";

const Screen6 = () => {
  // Form context
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  // FAQ hook
  const {
    getFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    isLoading,
    error: hookError,
    clearError,
  } = useFAQ();

  // FAQ state management
  const [faqs, setFaqs] = useState<FAQ[] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Create FAQ modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" });

  // Edit FAQ modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [updating, setUpdating] = useState(false);

  // Delete FAQ state
  const [deletingFAQId, setDeletingFAQId] = useState<string | null>(null);

  // Watch form values
  const faqsValue = watch("faqs") || [];

  // Selected FAQs for the course - sync with form
  const [selectedFAQIds, setSelectedFAQIds] = useState<string[]>(faqsValue);

  // Expanded FAQ state for preview
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  // Client-side mounting
  const [isMounted, setIsMounted] = useState(false);

  // Initialize selectedFAQIds from form value only once
  useEffect(() => {
    if (isMounted && faqsValue.length > 0 && selectedFAQIds.length === 0) {
      setSelectedFAQIds(faqsValue);
    }
  }, [faqsValue, isMounted, selectedFAQIds.length]);

  // Client-side mounting effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setFaqs([]);
    setPage(1);
    setHasMore(true);
    clearError();
    loadFAQs(1, true);
  }, [searchDebounced]);

  // Load FAQs function
  const loadFAQs = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (isLoading) return;

      try {
        const result = await getFAQs({
          page: pageNum,
          limit: 10,
          search: searchDebounced,
        });

        if (result) {
          if (reset) {
            setFaqs(result.faqs);
          } else {
            setFaqs((prev) => [...(prev || []), ...(result.faqs || [])]);
          }

          setHasMore(
            result.faqs?.length === 10 &&
              (faqs?.length || 0) + (result.faqs?.length || 0) < result.total
          );
          setPage(pageNum + 1);
        }
      } catch (error) {
        console.error("Error loading FAQs:", error);
      }
    },
    [isLoading, searchDebounced, getFAQs, clearError, faqs?.length]
  );

  // Infinite scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight + 100 &&
        hasMore &&
        !isLoading
      ) {
        loadFAQs(page);
      }
    },
    [hasMore, isLoading, page, loadFAQs]
  );

  // Load initial FAQs
  useEffect(() => {
    loadFAQs(1, true);
  }, []);

  // Handle FAQ selection
  const handleFAQToggle = (faqId: string) => {
    const newSelected = selectedFAQIds.includes(faqId)
      ? selectedFAQIds.filter((id: string) => id !== faqId)
      : [...selectedFAQIds, faqId];

    setSelectedFAQIds(newSelected);
    setValue("faqs", newSelected, { shouldDirty: true, shouldTouch: true });
  };

  // Handle create new FAQ
  const handleCreateFAQ = async () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) return;

    setCreating(true);
    try {
      const createdFAQ = await createFAQ(newFAQ);
      if (createdFAQ) {
        setFaqs((prev) => [createdFAQ, ...(prev || [])]);
        setNewFAQ({ question: "", answer: "" });
        setShowCreateModal(false);
        clearError(); // Clear any previous errors
      }
    } catch (error) {
      console.error("Error creating FAQ:", error);
      // Error is already handled by the hook
    } finally {
      setCreating(false);
    }
  };

  // Handle edit FAQ
  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setShowEditModal(true);
  };

  // Handle update FAQ
  const handleUpdateFAQ = async () => {
    if (
      !editingFAQ ||
      !editingFAQ._id ||
      !editingFAQ.question.trim() ||
      !editingFAQ.answer.trim()
    )
      return;

    setUpdating(true);
    try {
      const result = await updateFAQ(editingFAQ._id, {
        question: editingFAQ.question,
        answer: editingFAQ.answer,
      });

      if (result) {
        // Update the FAQ in the local state
        setFaqs((prev) =>
          (prev || []).map((faq) => (faq._id === editingFAQ._id ? result : faq))
        );
        setShowEditModal(false);
        setEditingFAQ(null);
        clearError();
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      // Error is already handled by the hook
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete FAQ
  const handleDeleteFAQ = async (faqId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this FAQ? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingFAQId(faqId);
    try {
      const result = await deleteFAQ(faqId);

      if (result) {
        // Remove the FAQ from local state
        setFaqs((prev) => (prev || []).filter((faq) => faq._id !== faqId));

        // Calculate new selected FAQs
        const newSelected = selectedFAQIds.filter((id) => id !== faqId);

        // Update both local state and form value
        setSelectedFAQIds(newSelected);
        setValue("faqs", newSelected, { shouldDirty: true, shouldTouch: true });

        clearError();
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      // Error is already handled by the hook
    } finally {
      setDeletingFAQId(null);
    }
  };

  // Toggle FAQ expansion
  const toggleFAQExpansion = (faqId: string) => {
    setExpandedFAQs((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(faqId)) {
        newExpanded.delete(faqId);
      } else {
        newExpanded.add(faqId);
      }
      return newExpanded;
    });
  };

  // Show loading during SSR
  if (!isMounted) {
    return (
      <Container
        title="Course FAQs (Screen 6)"
        description="Select pre-built FAQs or create new ones for your course"
        className="h-full w-full max-h-full overflow-hidden flex flex-col"
        classNameBody="flex flex-col gap-4"
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Loading FAQs...
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Course FAQs (Screen 6)"
      description="Select pre-built FAQs or create new ones for your course"
      className="h-full w-full max-h-full overflow-hidden flex flex-col"
      classNameBody="flex flex-col gap-4"
    >
      {/* Create FAQ Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Create New FAQ
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <Input
                label="Question"
                value={newFAQ.question}
                onChange={(e) =>
                  setNewFAQ((prev) => ({ ...prev, question: e.target.value }))
                }
                placeholder="Enter the frequently asked question"
                required
              />

              <TextArea
                label="Answer"
                value={newFAQ.answer}
                onChange={(e) =>
                  setNewFAQ((prev) => ({ ...prev, answer: e.target.value }))
                }
                placeholder="Provide a comprehensive answer to the question"
                rows={4}
                required
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={handleCreateFAQ}
                disabled={
                  !newFAQ.question.trim() || !newFAQ.answer.trim() || creating
                }
                className="flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create FAQ
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit FAQ Modal */}
      {showEditModal && editingFAQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Edit FAQ
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFAQ(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <Input
                label="Question"
                value={editingFAQ.question}
                onChange={(e) =>
                  setEditingFAQ((prev) =>
                    prev ? { ...prev, question: e.target.value } : null
                  )
                }
                placeholder="Enter the frequently asked question"
                required
              />

              <TextArea
                label="Answer"
                value={editingFAQ.answer}
                onChange={(e) =>
                  setEditingFAQ((prev) =>
                    prev ? { ...prev, answer: e.target.value } : null
                  )
                }
                placeholder="Provide a comprehensive answer to the question"
                rows={4}
                required
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton
                onClick={() => {
                  setShowEditModal(false);
                  setEditingFAQ(null);
                }}
                disabled={updating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={handleUpdateFAQ}
                disabled={
                  !editingFAQ?.question.trim() ||
                  !editingFAQ?.answer.trim() ||
                  updating
                }
                className="flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Update FAQ
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Course FAQs <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600">
                Select existing FAQs or create new ones for your course (
                {selectedFAQIds.length} selected)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WhiteButton
              onClick={() => {
                const allFaqIds = faqs?.map(faq => faq._id).filter((id): id is string => !!id) || [];
                setSelectedFAQIds(allFaqIds);
                setValue("faqs", allFaqIds, { shouldDirty: true, shouldTouch: true });
              }}
              className="flex items-center gap-2"
              disabled={!faqs || faqs.length === 0}
            >
              <Check className="w-4 h-4" />
              Select All
            </WhiteButton>
            <WhiteButton
              onClick={() => {
                setSelectedFAQIds([]);
                setValue("faqs", [], { shouldDirty: true, shouldTouch: true });
              }}
              className="flex items-center gap-2"
              disabled={selectedFAQIds.length === 0}
            >
              <X className="w-4 h-4" />
              Clear All
            </WhiteButton>
            <OrangeButton
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
              glow={false}
            >
              <Plus className="w-4 h-4" />
              Create FAQ
            </OrangeButton>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Search FAQs by question or answer..."
          />
        </div>
      </div>

      {/* FAQ Field Error Display */}
      {errors.faqs && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="text-red-800 font-semibold">Validation Error</h4>
              <p className="text-red-700 text-sm">
                {String(errors.faqs?.message || "")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
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

      {/* FAQs List */}
      <div
        className="flex-1 overflow-y-auto space-y-4 pr-2"
        onScroll={handleScroll}
        style={{ scrollbarWidth: "thin" }}
      >
        {faqs?.map((faq) => {
          if (!faq._id) return null; // Skip FAQs without ID

          const isSelected = selectedFAQIds.includes(faq._id);
          const isExpanded = expandedFAQs.has(faq._id);

          return (
            <div
              key={faq._id}
              className={`border rounded-xl p-4 transition-all cursor-pointer ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => faq._id && handleFAQToggle(faq._id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>

                {/* FAQ Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        {faq.question}
                      </h4>

                      {isExpanded && (
                        <div className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {faq.answer}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Created:{" "}
                          {new Date(faq.createdAt!).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </span>
                        {faq.updatedAt && (
                          <span>
                            Updated:{" "}
                            {new Date(faq.updatedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditFAQ(faq);
                        }}
                        className="text-gray-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit FAQ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          faq._id && handleDeleteFAQ(faq._id);
                        }}
                        disabled={deletingFAQId === faq._id}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete FAQ"
                      >
                        {deletingFAQId === faq._id ? (
                          <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          faq._id && toggleFAQExpansion(faq._id);
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

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="flex items-center gap-2 mt-3 text-blue-600 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Selected for this course
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              Loading FAQs...
            </div>
          </div>
        )}

        {/* No More FAQs */}
        {!hasMore && faqs && faqs.length > 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No more FAQs to load
          </div>
        )}

        {/* No FAQs Found */}
        {faqs?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No FAQs found" : "No FAQs available"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first FAQ to get started"}
            </p>
            <OrangeButton
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 mx-auto"
              glow={false}
            >
              <Plus className="w-4 h-4" />
              Create First FAQ
            </OrangeButton>
          </div>
        )}

        {/* Hidden input for form validation */}
        <Controller
          name="faqs"
          control={control}
          rules={{ required: "At least one FAQ is required" }}
          render={({ field }) => (
            <input type="hidden" {...field} value={selectedFAQIds} />
          )}
        />
      </div>
    </Container>
  );
};

export default Screen6;
