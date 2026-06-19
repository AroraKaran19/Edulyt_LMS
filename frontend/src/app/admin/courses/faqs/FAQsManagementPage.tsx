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
import { useFAQ, type FAQ } from "@/hooks/useFAQ";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import { toast } from "react-toastify";

const FAQsManagementPage = () => {
  const {
    getAdminFAQs,
    createFAQ,
    updateAdminFAQ,
    deleteAdminFAQ,
    isLoading,
    error: hookError,
    clearError,
    validateFAQ,
  } = useFAQ();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [totalFaqs, setTotalFaqs] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [updating, setUpdating] = useState(false);

  const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadFaqs = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (isLoading) return;

      try {
        const result = await getAdminFAQs({
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

          setTotalFaqs(result.total);
          setHasMore(pageNum < result.totalPages);
          setPage(pageNum + 1);
        }
      } catch {
        toast.error("Failed to load FAQs");
      }
    },
    [isLoading, searchDebounced, getAdminFAQs],
  );

  useEffect(() => {
    setFaqs([]);
    setPage(1);
    setHasMore(true);
    clearError();
    void loadFaqs(1, true);
  }, [searchDebounced]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight + 200 &&
        hasMore &&
        !isLoading
      ) {
        void loadFaqs(page);
      }
    },
    [hasMore, isLoading, page, loadFaqs],
  );

  const handleCreate = async () => {
    const v = validateFAQ(newFaq);
    if (!v.valid) {
      toast.error(v.error ?? "Invalid FAQ");
      return;
    }

    setCreating(true);
    try {
      const created = await createFAQ({
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim(),
      });
      if (created) {
        setFaqs((prev) => [created, ...prev]);
        setTotalFaqs((prev) => prev + 1);
        setNewFaq({ question: "", answer: "" });
        setShowCreateModal(false);
        clearError();
      }
    } catch {
      toast.error("Failed to create FAQ");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (
      !editingFaq?._id ||
      !editingFaq.question.trim() ||
      !editingFaq.answer.trim()
    ) {
      return;
    }

    const v = validateFAQ({
      question: editingFaq.question,
      answer: editingFaq.answer,
    });
    if (!v.valid) {
      toast.error(v.error ?? "Invalid FAQ");
      return;
    }

    setUpdating(true);
    try {
      const result = await updateAdminFAQ(editingFaq._id, {
        question: editingFaq.question.trim(),
        answer: editingFaq.answer.trim(),
      });

      if (result) {
        setFaqs((prev) =>
          prev.map((f) => (f._id === editingFaq._id ? result : f)),
        );
        setShowEditModal(false);
        setEditingFaq(null);
        clearError();
      }
    } catch {
      toast.error("Failed to update FAQ");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this FAQ? This cannot be undone if it is not linked elsewhere.",
      )
    ) {
      return;
    }

    setDeletingFaqId(id);
    try {
      const ok = await deleteAdminFAQ(id);
      if (ok) {
        setFaqs((prev) => prev.filter((f) => f._id !== id));
        setTotalFaqs((prev) => Math.max(0, prev - 1));
        clearError();
      }
    } catch {
      toast.error("Failed to delete FAQ");
    } finally {
      setDeletingFaqId(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage FAQs
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage global FAQs for courses and homepage ({totalFaqs}{" "}
                total)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by question or answer…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-shadow shadow-sm"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <OrangeButton
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create FAQ
              </OrangeButton>
            </div>
          </div>

          <div
            className="p-6 min-h-[600px] max-h-[calc(100vh-300px)] overflow-y-auto"
            onScroll={handleScroll}
            style={{ scrollbarWidth: "thin" }}
          >
            {hookError ? (
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
                    type="button"
                    onClick={clearError}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {faqs.length === 0 && !isLoading ? (
              <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? "No FAQs found" : "No FAQs yet"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? "Try different search terms"
                    : "Create your first FAQ to get started"}
                </p>
                <OrangeButton
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create FAQ
                </OrangeButton>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq) => {
                  if (!faq._id) return null;
                  const expanded = expandedIds.has(faq._id);
                  return (
                    <div
                      key={faq._id}
                      className="border border-gray-200 bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-orange-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {faq.question}
                          </h4>
                          {expanded ? (
                            <p className="text-gray-700 text-sm whitespace-pre-wrap border-l-2 border-orange-200 pl-3 mb-3">
                              {faq.answer}
                            </p>
                          ) : (
                            <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                              {faq.answer}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {faq.createdAt ? (
                              <span>
                                Created:{" "}
                                {new Date(faq.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                              </span>
                            ) : null}
                            {faq.updatedAt ? (
                              <span>
                                Updated:{" "}
                                {new Date(faq.updatedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFaq(faq);
                              setShowEditModal(true);
                            }}
                            className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(faq._id!)}
                            disabled={deletingFaqId === faq._id}
                            className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingFaqId === faq._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(faq._id!)}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title={expanded ? "Collapse" : "Expand"}
                          >
                            {expanded ? (
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

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center gap-3 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      Loading…
                    </div>
                  </div>
                ) : null}

                {!hasMore && faqs.length > 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No more FAQs to load
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                New FAQ
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Question"
                value={newFaq.question}
                onChange={(e) =>
                  setNewFaq((p) => ({ ...p, question: e.target.value }))
                }
                placeholder="Enter the question"
                required
              />
              <TextArea
                label="Answer"
                value={newFaq.answer}
                onChange={(e) =>
                  setNewFaq((p) => ({ ...p, answer: e.target.value }))
                }
                placeholder="Enter the answer"
                rows={6}
                required
              />
              <p className="text-xs text-gray-500">
                Question: 10–500 characters. Answer: 20–2000 characters.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                className="flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      ) : null}

      {showEditModal && editingFaq ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Edit FAQ</h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingFaq(null);
                }}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Question"
                value={editingFaq.question}
                onChange={(e) =>
                  setEditingFaq((prev) =>
                    prev ? { ...prev, question: e.target.value } : null,
                  )
                }
                placeholder="Question"
                required
              />
              <TextArea
                label="Answer"
                value={editingFaq.answer}
                onChange={(e) =>
                  setEditingFaq((prev) =>
                    prev ? { ...prev, answer: e.target.value } : null,
                  )
                }
                placeholder="Answer"
                rows={6}
                required
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingFaq(null);
                }}
                disabled={updating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                type="button"
                onClick={() => void handleUpdate()}
                disabled={updating}
                className="flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Save
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FAQsManagementPage;
