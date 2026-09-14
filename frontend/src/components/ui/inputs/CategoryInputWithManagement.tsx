import React, { useState, useEffect, useCallback, useRef } from "react";
import { useCategory } from "@/hooks/useCategory";
import { Category } from "@/types";
import {
  Plus,
  X,
  Edit3,
  Trash2,
  Check,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import DropDown from "@/components/ui/dropdown/DropDown";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import type { Brand } from "@/constants/brands";

interface CategoryInputWithManagementProps {
  label: string;
  name: string;
  value: string | string[];
  setChange: (value: string[]) => void;
  className?: string;
  required?: boolean;
  /** Category names from course data - avoids getCategoryById API calls */
  initialCategoryNames?: Record<string, string>;
  /** Called when a category is added so the form can persist its name (for display after navigation) */
  onCategoryNameAdded?: (id: string, name: string) => void;
  /** Lists and creates this brand's categories. Omit for the old, unscoped list. */
  brand?: Brand;
}

const CategoryInputWithManagement: React.FC<
  CategoryInputWithManagementProps
> = ({
  label,
  value,
  setChange,
  className = "",
  required = false,
  initialCategoryNames,
  onCategoryNameAdded,
  brand,
}) => {
  const {
    getActiveCategories,
    getAdminCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
    error,
    clearError,
  } = useCategory();

  const [categories, setCategories] = useState<Category[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {},
  );
  const [categoryPage, setCategoryPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const dropdownScrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<{
    name: string;
    audience: "college-students" | "professionals";
    showOnHomePage: boolean;
    showOnCourseList: boolean;
  }>({
    name: "",
    audience: "college-students",
    showOnHomePage: false,
    showOnCourseList: true,
  });
  const [categoryImage, setCategoryImage] = useState<string>("");
  const [categoryImageS3Key, setCategoryImageS3Key] = useState<string>("");
  const [categoryImageSource, setCategoryImageSource] = useState<
    "upload" | "url"
  >("upload");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { uploadFile, deleteFile } = useUpload();

  // Count categories with showOnHomePage: true
  const homePageCategoriesCount = categories.filter(
    (cat) => cat.showOnHomePage === true,
  ).length;
  const maxHomePageCategories = 4;
  const canAddToHomePage = homePageCategoriesCount < maxHomePageCategories;

  // Normalize value to array of category IDs
  const selectedCategoryIds = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  const PAGE_SIZE = 20;

  /**
   * The admin endpoint takes an explicit brand; the public one scopes by the
   * site it is called from, which is always Airkrit here.
   */
  const fetchCategoryPage = useCallback(
    async (page: number) => {
      if (!brand) {
        return getActiveCategories({ limit: PAGE_SIZE, page });
      }
      const result = await getAdminCategories({ limit: PAGE_SIZE, page, brand });
      return result?.categories
        ? {
            ...result,
            categories: result.categories.filter((c) => c.isActive !== false),
          }
        : result;
    },
    [brand, getActiveCategories, getAdminCategories],
  );

  useEffect(() => {
    setCategories([]);
    setCategoryPage(1);
    setHasMore(true);
  }, [brand]);

  // Load initial categories when dropdown opens
  const loadCategories = useCallback(async () => {
    try {
      const result = await fetchCategoryPage(1);
      if (result && result.categories) {
        setCategories(result.categories);
        setTotalPages(result.totalPages ?? 1);
        setCategoryPage(1);
        setHasMore((result.totalPages ?? 1) > 1);
      } else {
        setCategories([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories([]);
      setHasMore(false);
    }
  }, [fetchCategoryPage]);

  // Load next page for infinite scroll
  const loadMoreCategories = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = categoryPage + 1;
      const result = await fetchCategoryPage(nextPage);
      if (result && result.categories && result.categories.length > 0) {
        setCategories((prev) => [...prev, ...result.categories]);
        setCategoryPage(nextPage);
        setHasMore(nextPage < (result.totalPages ?? 1));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more categories:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchCategoryPage, hasMore, isLoadingMore, categoryPage]);

  // Handle scroll for infinite loading
  const handleDropdownScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (nearBottom && hasMore && !isLoadingMore) {
        loadMoreCategories();
      }
    },
    [hasMore, isLoadingMore, loadMoreCategories],
  );

  // Resolve names for selected IDs not in categories list - skip when course provided names
  useEffect(() => {
    if (initialCategoryNames) return;

    const unresolved = selectedCategoryIds.filter(
      (id) => !categories.find((c) => c._id === id),
    );
    if (unresolved.length === 0) return;

    let cancelled = false;
    unresolved.forEach((id) => {
      getCategoryById(id)
        .then((cat) => {
          if (!cancelled && cat?.name) {
            setResolvedNames((prev) => ({ ...prev, [id]: cat.name }));
          }
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCategoryIds, categories, getCategoryById, initialCategoryNames]);

  // Load categories only when dropdown opens (not on mount - avoids redundant calls)
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  // Get selected category names for display
  const getSelectedCategoryNames = () => {
    return selectedCategoryIds
      .map((id) => {
        const category = categories.find((cat) => cat._id === id);
        return category?.name;
      })
      .filter((name): name is string => !!name);
  };

  // Handle category toggle (add/remove by ID)
  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = selectedCategoryIds.includes(categoryId);
    if (isSelected) {
      setChange(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      setChange([...selectedCategoryIds, categoryId]);
      const category = categories.find((c) => c._id === categoryId);
      if (category?.name && onCategoryNameAdded) {
        onCategoryNameAdded(categoryId, category.name);
      }
    }
  };

  // Handle remove category chip
  const handleRemoveCategory = (categoryId: string) => {
    setChange(selectedCategoryIds.filter((id) => id !== categoryId));
  };

  // Handle file upload for category image
  const handleCategoryImageUpload = useCallback(
    async (file: File, folderName: string): Promise<string> => {
      setIsUploadingImage(true);
      try {
        const result = await uploadFile(file, folderName);
        if (result.success && result.data) {
          setCategoryImage(result.data.url);
          setCategoryImageS3Key(result.data.s3Key);
          setCategoryImageSource("upload");
          return result.data.url;
        } else {
          throw new Error(result.error || "Upload failed");
        }
      } catch (error) {
        console.error("Error uploading category image:", error);
        throw error;
      } finally {
        setIsUploadingImage(false);
      }
    },
    [uploadFile],
  );

  // Handle URL submission for category image
  const handleCategoryImageUrlSubmit = useCallback(
    async (url: string) => {
      // If there's an existing uploaded file, delete it from S3
      if (categoryImageS3Key && categoryImageSource === "upload") {
        try {
          await deleteFile(categoryImageS3Key);
        } catch (error) {
          console.error("Failed to delete old category image from S3:", error);
        }
      }

      setCategoryImage(url);
      setCategoryImageSource("url");
      setCategoryImageS3Key(""); // No S3 key for URL-based images
    },
    [categoryImageS3Key, categoryImageSource, deleteFile],
  );

  // Handle category image removal
  const handleCategoryImageRemove = useCallback(() => {
    setCategoryImage("");
    setCategoryImageS3Key("");
    setCategoryImageSource("upload");
  }, []);

  // Handle create new category
  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.name.trim()) return;
    if (!newCategory.audience) return;

    setIsCreating(true);
    try {
      const result = await createCategory({
        name: newCategory.name.trim(),
        ...(brand ? { brand } : {}),
        audience: newCategory.audience,
        showOnHomePage: newCategory.showOnHomePage || false,
        showOnCourseList: newCategory.showOnCourseList,
        categoryImage: categoryImage || undefined,
      });

      if (result && result._id) {
        setCategories((prev) => [...(prev || []), result]);
        // Add the new category ID to selected categories
        if (!selectedCategoryIds.includes(result._id)) {
          setChange([...selectedCategoryIds, result._id]);
        }
        if (result.name && onCategoryNameAdded) {
          onCategoryNameAdded(result._id, result.name);
        }
        setNewCategory({
          name: "",
          audience: "college-students",
          showOnHomePage: false,
          showOnCourseList: true,
        });
        setCategoryImage("");
        setCategoryImageS3Key("");
        setCategoryImageSource("upload");
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
    // Set the category image state when opening edit modal
    setCategoryImage(category.categoryImage || "");
    // Determine if image is from URL or upload (if it's an S3 URL, it's upload)
    if (category.categoryImage) {
      const isS3Url =
        category.categoryImage.includes("s3.amazonaws.com") ||
        category.categoryImage.includes("amazonaws.com");
      setCategoryImageSource(isS3Url ? "upload" : "url");
    } else {
      setCategoryImageSource("upload");
    }
    setCategoryImageS3Key(""); // We don't track S3 key in edit mode for now
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

    const oldName = categories.find(
      (cat) => cat._id === editingCategory._id,
    )?.name;
    setIsUpdating(true);
    try {
      const result = await updateCategory(editingCategory._id, {
        name: editingCategory.name.trim(),
        audience: editingCategory.audience || "college-students",
        showOnHomePage: editingCategory.showOnHomePage,
        showOnCourseList: editingCategory.showOnCourseList,
        categoryImage: categoryImage || undefined,
      });

      if (result) {
        setCategories((prev) =>
          (prev || []).map((cat) =>
            cat._id === editingCategory._id ? result : cat,
          ),
        );

        // If the category was selected, keep it selected (ID doesn't change on update)
        // No need to update selectedCategoryIds as the ID remains the same

        setShowEditModal(false);
        setEditingCategory(null);
        setCategoryImage("");
        setCategoryImageS3Key("");
        setCategoryImageSource("upload");
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
    categoryName: string,
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(categoryId);
    try {
      const result = await deleteCategory(categoryId);

      if (result) {
        setCategories((prev) =>
          (prev || []).filter((cat) => cat._id !== categoryId),
        );
        // Remove from selected categories if it was selected
        if (selectedCategoryIds.includes(categoryId)) {
          setChange(selectedCategoryIds.filter((id) => id !== categoryId));
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

      {/* Selected Categories Display */}
      {selectedCategoryIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCategoryIds.map((categoryId) => {
            const category = categories.find((cat) => cat._id === categoryId);
            const categoryName =
              category?.name ||
              initialCategoryNames?.[categoryId] ||
              resolvedNames[categoryId] ||
              categoryId;
            return (
              <div
                key={categoryId}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium"
              >
                <span>{categoryName}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(categoryId)}
                  className="ml-1 text-orange-600 hover:text-orange-800 focus:outline-none cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-xl text-left focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
          selectedCategoryIds.length > 0
            ? "border-orange-300 bg-orange-50 text-gray-900"
            : "border-gray-300 bg-white text-gray-500"
        }`}
      >
        <div className="flex items-center justify-between">
          <span>
            {selectedCategoryIds.length > 0
              ? `Select more categories (${selectedCategoryIds.length} selected)`
              : "Select categories"}
          </span>
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
            <ChevronDown
              className={`w-5 h-5 transition-transform cursor-pointer ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownScrollRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg min-h-[240px] max-h-60 overflow-y-auto"
          onScroll={handleDropdownScroll}
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-2" />
              Loading categories...
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="py-2">
              {categories?.map((category) => {
                if (!category._id) return null; // Skip categories without ID

                const isSelected = category._id
                  ? selectedCategoryIds.includes(category._id)
                  : false;

                return (
                  <div
                    key={category._id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 group"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        category._id && handleCategoryToggle(category._id)
                      }
                      className="flex-1 text-left flex items-center gap-3"
                    >
                      <div
                        className={`shrink-0 w-5 h-5 min-w-5 min-h-5 border-2 rounded flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-orange-500 border-orange-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-gray-500">
                            {category.description}
                          </div>
                        )}
                      </div>
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
              {isLoadingMore && (
                <div className="py-3 flex justify-center">
                  <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                </div>
              )}
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Create New Category
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCategory({
                      name: "",
                      audience: "college-students",
                      showOnHomePage: false,
                      showOnCourseList: true,
                    });
                    setCategoryImage("");
                    setCategoryImageS3Key("");
                    setCategoryImageSource("upload");
                    clearError();
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
              <Input
                label="Category Name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter category name"
                required
              />

              <DropDown
                label="Audience"
                required
                options={["college-students", "professionals"]}
                optionLabels={{
                  "college-students": "College Students",
                  professionals: "Working Professionals",
                }}
                value={newCategory.audience}
                onChange={(e) =>
                  setNewCategory((prev) => ({
                    ...prev,
                    audience: e.target.value as
                      | "college-students"
                      | "professionals",
                  }))
                }
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showOnHomePage"
                  checked={newCategory.showOnHomePage || false}
                  onChange={(e) => {
                    if (e.target.checked && !canAddToHomePage) {
                      return; // Prevent checking if limit reached
                    }
                    setNewCategory((prev) => ({
                      ...prev,
                      showOnHomePage: e.target.checked,
                    }));
                  }}
                  disabled={!canAddToHomePage && !newCategory.showOnHomePage}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="showOnHomePage"
                  className={`text-sm font-medium ${
                    !canAddToHomePage && !newCategory.showOnHomePage
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 cursor-pointer"
                  }`}
                >
                  Show on Home Page
                  {!canAddToHomePage && !newCategory.showOnHomePage && (
                    <span className="ml-1 text-xs text-gray-500">
                      (Max 4 reached)
                    </span>
                  )}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showOnCourseList"
                  checked={newCategory.showOnCourseList !== false}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      showOnCourseList: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                />
                <label
                  htmlFor="showOnCourseList"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Show on course list
                </label>
              </div>

              <UploadMediaContainer
                title="Category Image/Thumbnail"
                description="Upload an image or provide a URL for the category thumbnail"
                type="image"
                mediaUrl={categoryImage}
                mediaSource={categoryImageSource}
                s3Key={categoryImageS3Key}
                maxSize={10}
                onFileUpload={handleCategoryImageUpload}
                onUrlSubmit={handleCategoryImageUrlSubmit}
                onFileRemove={handleCategoryImageRemove}
                isUploading={isUploadingImage}
                folderName="category-images"
                allowUrlInput={true}
                showConfirmation={false}
              />

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <WhiteButton
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCategory({
                    name: "",
                    audience: "college-students",
                    showOnHomePage: false,
                    showOnCourseList: true,
                  });
                  setCategoryImage("");
                  setCategoryImageS3Key("");
                  setCategoryImageSource("upload");
                  clearError();
                }}
                disabled={isCreating}
              >
                Cancel
              </WhiteButton>
              <OrangeButton
                onClick={handleCreateCategory}
                disabled={
                  !newCategory.name ||
                  !newCategory.name.trim() ||
                  !newCategory.audience ||
                  isCreating
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
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 shrink-0">
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
                  className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
              <Input
                label="Category Name"
                value={editingCategory.name}
                onChange={(e) =>
                  setEditingCategory((prev) =>
                    prev ? { ...prev, name: e.target.value } : null,
                  )
                }
                placeholder="Enter category name"
                required
              />

              <DropDown
                label="Audience"
                required
                options={["college-students", "professionals"]}
                optionLabels={{
                  "college-students": "College Students",
                  professionals: "Working Professionals",
                }}
                value={editingCategory.audience || "college-students"}
                onChange={(e) =>
                  setEditingCategory((prev) =>
                    prev
                      ? {
                          ...prev,
                          audience: e.target.value as
                            | "college-students"
                            | "professionals",
                        }
                      : null,
                  )
                }
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editShowOnHomePage"
                  checked={editingCategory.showOnHomePage || false}
                  onChange={(e) => {
                    // Allow unchecking, but check limit when checking
                    if (e.target.checked) {
                      // Count other categories with showOnHomePage: true (excluding current)
                      const otherHomePageCount = categories.filter(
                        (cat) =>
                          cat.showOnHomePage === true &&
                          cat._id !== editingCategory._id,
                      ).length;
                      if (otherHomePageCount >= maxHomePageCategories) {
                        return; // Prevent checking if limit reached
                      }
                    }
                    setEditingCategory((prev) =>
                      prev
                        ? { ...prev, showOnHomePage: e.target.checked }
                        : null,
                    );
                  }}
                  disabled={
                    !editingCategory.showOnHomePage &&
                    categories.filter(
                      (cat) =>
                        cat.showOnHomePage === true &&
                        cat._id !== editingCategory._id,
                    ).length >= maxHomePageCategories
                  }
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="editShowOnHomePage"
                  className={`text-sm font-medium ${
                    !editingCategory.showOnHomePage &&
                    categories.filter(
                      (cat) =>
                        cat.showOnHomePage === true &&
                        cat._id !== editingCategory._id,
                    ).length >= maxHomePageCategories
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 cursor-pointer"
                  }`}
                >
                  Show on Home Page
                  {!editingCategory.showOnHomePage &&
                    categories.filter(
                      (cat) =>
                        cat.showOnHomePage === true &&
                        cat._id !== editingCategory._id,
                    ).length >= maxHomePageCategories && (
                      <span className="ml-1 text-xs text-gray-500">
                        (Max 4 reached)
                      </span>
                    )}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editShowOnCourseList"
                  checked={editingCategory.showOnCourseList !== false}
                  onChange={(e) =>
                    setEditingCategory((prev) =>
                      prev
                        ? { ...prev, showOnCourseList: e.target.checked }
                        : null,
                    )
                  }
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                />
                <label
                  htmlFor="editShowOnCourseList"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Show on course list
                </label>
              </div>

              <UploadMediaContainer
                title="Category Image/Thumbnail"
                description="Upload an image or provide a URL for the category thumbnail"
                type="image"
                mediaUrl={categoryImage}
                mediaSource={categoryImageSource}
                s3Key={categoryImageS3Key}
                maxSize={10}
                onFileUpload={handleCategoryImageUpload}
                onUrlSubmit={handleCategoryImageUrlSubmit}
                onFileRemove={handleCategoryImageRemove}
                isUploading={isUploadingImage}
                folderName="category-images"
                allowUrlInput={true}
                showConfirmation={false}
              />

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <WhiteButton
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  setCategoryImage("");
                  setCategoryImageS3Key("");
                  setCategoryImageSource("upload");
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
