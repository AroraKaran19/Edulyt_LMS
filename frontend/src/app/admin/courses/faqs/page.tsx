"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  HelpCircle,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
} from "lucide-react";
import { FAQ } from "@/types";
import { useFAQ } from "@/hooks/useFAQ";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import { toast } from "react-toastify";

const FAQsManagementPage = () => {
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
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [totalFAQs, setTotalFAQs] = useState(0);

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

  // Expanded FAQ state for preview
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset when search changes
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
          limit: 20,
          search: searchDebounced,
        });

        if (result) {
          if (reset) {
            setFaqs(result.faqs || []);
          } else {
            setFaqs((prev) => [...prev, ...(result.faqs || [])]);
          }

          setTotalFAQs(result.total);
          setHasMore(pageNum < result.totalPages);
          setPage(pageNum + 1);
        }
      } catch (error) {
        console.error("Error loading FAQs:", error);
        toast.error("Failed to load FAQs");
      }
    },
    [isLoading, searchDebounced, getFAQs],
  );

  // Infinite scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight + 200 &&
        hasMore &&
        !isLoading
      ) {
        loadFAQs(page);
      }
    },
    [hasMore, isLoading, page, loadFAQs],
  );

  // Load initial FAQs
  useEffect(() => {
    loadFAQs(1, true);
  }, []);

  // Handle create new FAQ
  const handleCreateFAQ = async () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) return;

    setCreating(true);
    try {
      const createdFAQ = await createFAQ(newFAQ);
      if (createdFAQ) {
        setFaqs((prev) => [createdFAQ, ...prev]);
        setTotalFAQs((prev) => prev + 1);
        setNewFAQ({ question: "", answer: "" });
        setShowCreateModal(false);
        toast.success("FAQ created successfully!");
        clearError();
      }
    } catch (error) {
      console.error("Error creating FAQ:", error);
      toast.error("Failed to create FAQ");
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
        setFaqs((prev) =>
          prev.map((faq) => (faq._id === editingFAQ._id ? result : faq)),
        );
        setShowEditModal(false);
        setEditingFAQ(null);
        toast.success("FAQ updated successfully!");
        clearError();
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast.error("Failed to update FAQ");
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete FAQ
  const handleDeleteFAQ = async (faqId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this FAQ? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingFAQId(faqId);
    try {
      const result = await deleteFAQ(faqId);

      if (result) {
        setFaqs((prev) => prev.filter((faq) => faq._id !== faqId));
        setTotalFAQs((prev) => prev - 1);
        toast.success("FAQ deleted successfully!");
        clearError();
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
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

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage FAQs</h1>
              <p className="text-gray-600 mt-1">
                Create and manage frequently asked questions ({totalFAQs} total)
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Search and Actions */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search FAQs by question or answer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 cursor-pointer transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Create Button */}
              <OrangeButton
                onClick={() => setShowCreateModal(true)}
                className="flex items-center cursor-pointer gap-2"
              >
                <Plus className="w-4 h-4" />
                Create FAQ
              </OrangeButton>
            </div>
          </div>

          {/* Content Area */}
          <div
            className="p-6 min-h-[600px] max-h-[calc(100vh-300px)] overflow-y-auto"
            onScroll={handleScroll}
            style={{ scrollbarWidth: "thin" }}
          >
            {/* Error Display */}
            {hookError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-800 font-semibold">Error</h4>
                    <p className="text-red-700 text-sm">{hookError}</p>
                  </div>
                  <button
                    onClick={clearError}
                    className="text-red-500 cursor-pointer hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* FAQs List */}
            {faqs.length === 0 && !isLoading ? (
              <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? "No FAQs found" : "No FAQs available"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Create your first FAQ to get started"}
                </p>
                <OrangeButton
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center cursor-pointer gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create First FAQ
                </OrangeButton>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq) => {
                  if (!faq._id) return null;

                  const isExpanded = expandedFAQs.has(faq._id);

                  return (
                    <div
                      key={faq._id}
                      className="border border-gray-200 bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-200"
                    >
                      <div className="flex items-start gap-4">
                        {/* FAQ Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {faq.question}
                          </h4>

                          {isExpanded && (
                            <div className="text-sm text-gray-600 mb-3 leading-relaxed whitespace-pre-wrap">
                              {faq.answer}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Created:{" "}
                              {new Date(faq.createdAt!).toLocaleDateString()}
                            </span>
                            {faq.updatedAt && (
                              <span>
                                Updated:{" "}
                                {new Date(faq.updatedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditFAQ(faq)}
                            className="text-gray-400 cursor-pointer hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit FAQ"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => faq._id && handleDeleteFAQ(faq._id)}
                            disabled={deletingFAQId === faq._id}
                            className="text-gray-400 cursor-pointer hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete FAQ"
                          >
                            {deletingFAQId === faq._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>

                          {/* Expand/Collapse Button */}
                          <button
                            onClick={() =>
                              faq._id && toggleFAQExpansion(faq._id)
                            }
                            className="text-gray-400 cursor-pointer hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                    </div>
                  );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center gap-3 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      Loading FAQs...
                    </div>
                  </div>
                )}

                {/* No More FAQs */}
                {!hasMore && faqs.length > 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No more FAQs to load
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
                  className="text-gray-500 cursor-pointer hover:text-gray-700 p-1"
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
                rows={6}
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
                className="flex items-center cursor-pointer gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
                  className="text-gray-500 cursor-pointer hover:text-gray-700 p-1"
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
                    prev ? { ...prev, question: e.target.value } : null,
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
                    prev ? { ...prev, answer: e.target.value } : null,
                  )
                }
                placeholder="Provide a comprehensive answer to the question"
                rows={6}
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
                className="flex items-center cursor-pointer gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
    </div>
  );
};

export default FAQsManagementPage;
