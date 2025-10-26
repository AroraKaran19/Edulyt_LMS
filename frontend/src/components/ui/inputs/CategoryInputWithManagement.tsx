import React, { useState, useEffect, useCallback } from "react";
import { useCategory } from "@/hooks/useCategory";
import { Category } from "@/types";
import { Plus, X, Edit3, Trash2, Check, AlertCircle } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";

interface CategoryInputWithManagementProps {
  label: string;
  name: string;
  value: string;
  setChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

const CategoryInputWithManagement: React.FC<
  CategoryInputWithManagementProps
> = ({ label, value, setChange, className = "", required = false }) => {
  const {
    getActiveCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
    error,
    clearError,
  } = useCategory();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Load categories when dropdown opens
  const loadCategories = useCallback(async () => {
    try {
      const result = await getActiveCategories();
      if (result && result.categories) {
        setCategories(result.categories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories([]);
    }
  }, [getActiveCategories]);

  // Load categories when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    setChange(categoryName);
    setIsOpen(false);
  };

  // Handle create new category
  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.name.trim()) return;

    setIsCreating(true);
    try {
      const result = await createCategory({
        name: newCategory.name.trim(),
      });

      if (result) {
        setCategories((prev) => [...(prev || []), result]);
        setChange(result.name);
        setNewCategory({ name: "" });
        setShowCreateModal(false);
        clearError();
      }
    } catch (err) {
      console.error("Error creating category:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle edit category
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowEditModal(true);
  };

  // Handle update category
  const handleUpdateCategory = async () => {
    if (
      !editingCategory ||
      !editingCategory._id ||
      !editingCategory.name ||
      !editingCategory.name.trim()
    )
      return;

    setIsUpdating(true);
    try {
      const result = await updateCategory(editingCategory._id, {
        name: editingCategory.name.trim(),
      });

      if (result) {
        setCategories((prev) =>
          (prev || []).map((cat) =>
            cat._id === editingCategory._id ? result : cat
          )
        );
        setShowEditModal(false);
        setEditingCategory(null);
        clearError();
      }
    } catch (err) {
      console.error("Error updating category:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(categoryId);
    try {
      const result = await deleteCategory(categoryId);

      if (result) {
        setCategories((prev) =>
          (prev || []).filter((cat) => cat._id !== categoryId)
        );
        if (value === categoryName) {
          setChange("");
        }
        clearError();
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-xl text-left focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
          value && value !== "Select a category"
            ? "border-orange-300 bg-orange-50 text-gray-900"
            : "border-gray-300 bg-white text-gray-500"
        }`}
      >
        <div className="flex items-center justify-between">
          <span>{value || "Select a category"}</span>
          <div className="flex items-center gap-2">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateModal(true);
              }}
              className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded cursor-pointer"
              title="Create new category"
            >
              <Plus className="w-4 h-4" />
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-2" />
              Loading categories...
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="py-2">
              {categories?.map((category) => {
                if (!category._id) return null; // Skip categories without ID

                return (
                  <div
                    key={category._id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(category.name)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-gray-900">
                        {category.name}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-500">
                          {category.description}
                        </div>
                      )}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                        title="Edit category"
                      >
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          category._id &&
                            handleDeleteCategory(category._id, category.name);
                        }}
                        className={`p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer ${
                          isDeleting === category._id ? "opacity-50" : ""
                        }`}
                        title="Delete category"
                      >
                        {isDeleting === category._id ? (
                          <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <div className="mb-2">No categories found</div>
              <div
                onClick={() => setShowCreateModal(true)}
                className="text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
              >
                Create your first category
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Create New Category
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCategory({ name: "" });
                    clearError();
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <Input
                label="Category Name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter category name"
                required
              />

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <WhiteButton
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCategory({ name: "" });
                  clearError();
                }}
                disabled={isCreating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={handleCreateCategory}
                disabled={
                  !newCategory.name || !newCategory.name.trim() || isCreating
                }
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Category
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Edit Category
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                    clearError();
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <Input
                label="Category Name"
                value={editingCategory.name}
                onChange={(e) =>
                  setEditingCategory((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder="Enter category name"
                required
              />

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
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
                onClick={handleUpdateCategory}
                disabled={
                  !editingCategory ||
                  !editingCategory.name ||
                  !editingCategory.name.trim() ||
                  isUpdating
                }
                className="flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Update Category
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default CategoryInputWithManagement;
