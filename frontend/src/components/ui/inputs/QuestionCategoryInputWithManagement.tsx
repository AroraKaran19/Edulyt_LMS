"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  X,
  Edit3,
  Trash2,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import {
  useQuestionCategory,
  type QuestionCategoryRow,
} from "@/hooks/useQuestionCategory";

interface QuestionCategoryInputWithManagementProps {
  label?: string;
  /** Currently selected category ID, or null for "all / none" */
  value: string | null;
  onChange: (id: string | null) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  /** When true the component renders as a compact filter chip rather than a form field */
  compact?: boolean;
}

const PAGE_SIZE = 20;

const QuestionCategoryInputWithManagement: React.FC<
  QuestionCategoryInputWithManagementProps
> = ({
  label = "Question Category",
  value,
  onChange,
  className = "",
  required = false,
  placeholder = "Select category",
  compact = false,
}) => {
  const {
    getActiveQuestionCategories,
    createQuestionCategory,
    updateQuestionCategory,
    deleteQuestionCategory,
    isLoading,
    error,
    clearError,
  } = useQuestionCategory();

  const [categories, setCategories] = useState<QuestionCategoryRow[]>([]);
  const [resolvedName, setResolvedName] = useState<string>("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<QuestionCategoryRow | null>(null);

  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Load page 1 when dropdown opens ────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
      const result = await getActiveQuestionCategories({
        limit: PAGE_SIZE,
        page: 1,
      });
      if (result?.categories) {
        setCategories(result.categories);
        setTotalPages(result.totalPages ?? 1);
        setCategoryPage(1);
        setHasMore((result.totalPages ?? 1) > 1);
      } else {
        setCategories([]);
        setHasMore(false);
      }
    } catch {
      setCategories([]);
      setHasMore(false);
    }
  }, [getActiveQuestionCategories]);

  useEffect(() => {
    if (isOpen) void loadCategories();
  }, [isOpen, loadCategories]);

  // ── Infinite scroll ─────────────────────────────────────────────────────────
  const loadMoreCategories = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = categoryPage + 1;
      const result = await getActiveQuestionCategories({
        limit: PAGE_SIZE,
        page: nextPage,
      });
      if (result?.categories?.length) {
        setCategories((prev) => [...prev, ...result.categories]);
        setCategoryPage(nextPage);
        setHasMore(nextPage < (result.totalPages ?? 1));
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [getActiveQuestionCategories, hasMore, isLoadingMore, categoryPage]);

  const handleDropdownScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (
        el.scrollHeight - el.scrollTop - el.clientHeight < 80 &&
        hasMore &&
        !isLoadingMore
      ) {
        void loadMoreCategories();
      }
    },
    [hasMore, isLoadingMore, loadMoreCategories],
  );

  // ── Resolve selected name when value comes from outside list ────────────────
  const { getQuestionCategoryById } = useQuestionCategory();
  useEffect(() => {
    if (!value) {
      setResolvedName("");
      return;
    }
    const found = categories.find((c) => c._id === value);
    if (found) {
      setResolvedName(found.name);
      return;
    }
    let cancelled = false;
    getQuestionCategoryById(value)
      .then((cat) => {
        if (!cancelled && cat?.name) setResolvedName(cat.name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, categories, getQuestionCategoryById]);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const result = await createQuestionCategory(newName.trim());
      if (result?._id) {
        setCategories((prev) => [...prev, result]);
        onChange(result._id);
        setResolvedName(result.name);
        setNewName("");
        setShowCreateModal(false);
        clearError();
      }
    } finally {
      setIsCreating(false);
    }
  };

  // ── Update ──────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editingCategory?._id || !editName.trim()) return;
    setIsUpdating(true);
    try {
      const result = await updateQuestionCategory(editingCategory._id, {
        name: editName.trim(),
      });
      if (result) {
        setCategories((prev) =>
          prev.map((c) => (c._id === result._id ? result : c)),
        );
        if (value === result._id) setResolvedName(result.name);
        setShowEditModal(false);
        setEditingCategory(null);
        clearError();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeleteConfirm(null);
    setIsDeleting(id);
    try {
      const ok = await deleteQuestionCategory(id);
      if (ok) {
        setCategories((prev) => prev.filter((c) => c._id !== id));
        if (value === id) {
          onChange(null);
          setResolvedName("");
        }
        clearError();
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const selectedName = value
    ? (categories.find((c) => c._id === value)?.name ?? resolvedName ?? value)
    : null;

  // ── Trigger button text ─────────────────────────────────────────────────────
  const triggerLabel = selectedName ?? placeholder;

  return (
    <div className={`relative ${className}`}>
      {!compact && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger button — matches Select component style */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full px-4 py-3.5 text-left bg-white border rounded-xl flex items-center justify-between transition-all duration-200 outline-none shadow-sm hover:shadow-md ${
          isOpen
            ? "border-orange-500 ring-2 ring-orange-500/20"
            : "border-gray-300 hover:border-orange-400"
        }`}
      >
        <span
          className={`text-sm truncate ${selectedName ? "text-black" : "text-gray-500"}`}
        >
          {triggerLabel}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedName && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setResolvedName("");
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange(null);
                  setResolvedName("");
                }
              }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400 transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200" />
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto min-w-[220px]"
          onScroll={handleDropdownScroll}
        >
          {/* Create new category */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setShowCreateModal(true);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors border-b border-gray-100"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Create new category
          </button>

          {/* "No filter" option */}
          <div
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            onClick={() => {
              onChange(null);
              setResolvedName("");
              setIsOpen(false);
            }}
          >
            <div
              className={`shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                !value ? "bg-orange-500 border-orange-500" : "border-gray-300"
              }`}
            >
              {!value && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm text-gray-500 italic">All categories</span>
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-2" />
              Loading…
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No categories yet — use the button above to create one.
            </div>
          ) : (
            <div className="py-1">
              {categories.map((cat) => {
                const isSelected = cat._id === value;
                return (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 group"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChange(isSelected ? null : cat._id);
                        setResolvedName(isSelected ? "" : cat.name);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left flex items-center gap-3"
                    >
                      <div
                        className={`shrink-0 w-5 h-5 min-w-5 border-2 rounded flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-orange-500 border-orange-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {cat.name}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(cat);
                          setEditName(cat.name);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(cat._id, cat.name);
                        }}
                        disabled={isDeleting === cat._id}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer disabled:opacity-50"
                        title="Delete"
                      >
                        {isDeleting === cat._id ? (
                          <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {isLoadingMore && (
                <div className="py-3 flex justify-center">
                  <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click-outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* ── Create Modal ────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                New Question Category
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName("");
                  clearError();
                }}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Category Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. JavaScript, Data Structures…"
                required
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter") void handleCreate();
                }}
              />
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName("");
                  clearError();
                }}
                disabled={isCreating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={() => void handleCreate()}
                disabled={!newName.trim() || isCreating}
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete category?
              </h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">
                  &ldquo;{deleteConfirm.name}&rdquo;
                </span>{" "}
                will be permanently deleted. Questions assigned to it will lose
                their category tag.
              </p>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <WhiteButton onClick={() => setDeleteConfirm(null)}>
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={() => void handleDelete()}
                className="bg-red-600 hover:bg-red-700 border-red-600 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Edit Category
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  clearError();
                }}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Category Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Category name"
                required
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter") void handleUpdate();
                }}
              />
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  clearError();
                }}
                disabled={isUpdating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={() => void handleUpdate()}
                disabled={!editName.trim() || isUpdating}
                className="flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save
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

export default QuestionCategoryInputWithManagement;
