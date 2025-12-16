"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Tag, Search, Loader2 } from "lucide-react";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import Select from "@/components/ui/inputs/Select";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import { useCoupon } from "@/hooks/useCoupon";
import { CreateCouponData, UpdateCouponData, Coupon } from "@/types/coupon";
import { toast } from "react-toastify";
import { useCourse } from "@/hooks/useCourse";
import { useCategory } from "@/hooks/useCategory";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (coupon: Coupon) => void;
  editingCoupon?: Coupon | null;
  mode?: "create" | "edit";
}

const CouponModal = ({
  isOpen,
  onClose,
  onSuccess,
  editingCoupon,
  mode = "create",
}: CouponModalProps) => {
  const { createCoupon, updateCoupon, isLoading } = useCoupon();
  const { getCourses } = useCourse();
  const { getCategories } = useCategory();

  const [formData, setFormData] = useState<CreateCouponData | UpdateCouponData>(
    {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      applicableType: "all",
      applicableCourses: [],
      applicableCategories: [],
      minPurchaseAmount: 0,
      maxDiscountAmount: undefined,
      usageLimit: undefined,
      userUsageLimit: 1,
      validFrom: "",
      validUntil: "",
      isActive: true,
    }
  );

  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Course search and pagination
  const [courseSearch, setCourseSearch] = useState("");
  const [coursePage, setCoursePage] = useState(1);
  const [hasMoreCourses, setHasMoreCourses] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const coursesScrollRef = useRef<HTMLDivElement>(null);
  const courseSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Category search and pagination
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [hasMoreCategories, setHasMoreCategories] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const categorySearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load categories with pagination
  const loadCategories = useCallback(
    async (page: number, search: string, append: boolean = false) => {
      setLoadingCategories(true);
      try {
        const categoriesRes = await getCategories({
          page,
          limit: 20,
          search: search || undefined,
        });

        if (categoriesRes && categoriesRes.categories) {
          if (append) {
            setCategories((prev) => [
              ...prev,
              ...(categoriesRes.categories || []),
            ]);
          } else {
            setCategories(categoriesRes.categories || []);
          }
          setHasMoreCategories(page < (categoriesRes.totalPages || 0));
        } else {
          // No results or invalid response
          if (!append) {
            setCategories([]);
          }
          setHasMoreCategories(false);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        if (!append) {
          setCategories([]);
        }
        setHasMoreCategories(false);
      } finally {
        setLoadingCategories(false);
      }
    },
    [getCategories]
  );

  // Initial load categories on modal open
  useEffect(() => {
    if (isOpen) {
      setCategories([]);
      setCategoryPage(1);
      setCategorySearch("");
      setHasMoreCategories(true);
      loadCategories(1, "");
    }
  }, [isOpen, loadCategories]);

  // Load courses with pagination
  const loadCourses = useCallback(
    async (page: number, search: string, append: boolean = false) => {
      setLoadingCourses(true);
      try {
        const coursesRes = await getCourses({
          page,
          limit: 20,
          search: search || undefined,
        });

        if (coursesRes && coursesRes.courses) {
          if (append) {
            setCourses((prev) => [...prev, ...(coursesRes.courses || [])]);
          } else {
            setCourses(coursesRes.courses || []);
          }
          setHasMoreCourses(page < (coursesRes.totalPages || 0));
        } else {
          // No results or invalid response
          if (!append) {
            setCourses([]);
          }
          setHasMoreCourses(false);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
        if (!append) {
          setCourses([]);
        }
        setHasMoreCourses(false);
      } finally {
        setLoadingCourses(false);
      }
    },
    [getCourses]
  );

  // Initial load and reset on modal open
  useEffect(() => {
    if (isOpen) {
      setCourses([]);
      setCoursePage(1);
      setCourseSearch("");
      setHasMoreCourses(true);
      loadCourses(1, "");
    }
  }, [isOpen, loadCourses]);

  // Debounced search effect for courses
  useEffect(() => {
    if (courseSearchTimeoutRef.current) {
      clearTimeout(courseSearchTimeoutRef.current);
    }

    courseSearchTimeoutRef.current = setTimeout(() => {
      setCourses([]);
      setCoursePage(1);
      setHasMoreCourses(true);
      loadCourses(1, courseSearch);
    }, 500);

    return () => {
      if (courseSearchTimeoutRef.current) {
        clearTimeout(courseSearchTimeoutRef.current);
      }
    };
  }, [courseSearch, loadCourses]);

  // Debounced search effect for categories
  useEffect(() => {
    if (categorySearchTimeoutRef.current) {
      clearTimeout(categorySearchTimeoutRef.current);
    }

    categorySearchTimeoutRef.current = setTimeout(() => {
      setCategories([]);
      setCategoryPage(1);
      setHasMoreCategories(true);
      loadCategories(1, categorySearch);
    }, 500);

    return () => {
      if (categorySearchTimeoutRef.current) {
        clearTimeout(categorySearchTimeoutRef.current);
      }
    };
  }, [categorySearch, loadCategories]);

  // Infinite scroll handler for courses
  const handleCoursesScroll = useCallback(() => {
    const scrollContainer = coursesScrollRef.current;
    if (!scrollContainer || loadingCourses || !hasMoreCourses) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      const nextPage = coursePage + 1;
      setCoursePage(nextPage);
      loadCourses(nextPage, courseSearch, true);
    }
  }, [coursePage, courseSearch, loadingCourses, hasMoreCourses, loadCourses]);

  // Infinite scroll handler for categories
  const handleCategoriesScroll = useCallback(() => {
    const scrollContainer = categoriesScrollRef.current;
    if (!scrollContainer || loadingCategories || !hasMoreCategories) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      const nextPage = categoryPage + 1;
      setCategoryPage(nextPage);
      loadCategories(nextPage, categorySearch, true);
    }
  }, [
    categoryPage,
    categorySearch,
    loadingCategories,
    hasMoreCategories,
    loadCategories,
  ]);

  // Load editing coupon data
  useEffect(() => {
    if (editingCoupon && mode === "edit") {
      setFormData({
        code: editingCoupon.code,
        description: editingCoupon.description || "",
        discountType: editingCoupon.discountType,
        discountValue: editingCoupon.discountValue,
        applicableType: editingCoupon.applicableType,
        applicableCourses:
          (editingCoupon.applicableCourses as any[])?.map((c) =>
            typeof c === "string" ? c : c._id
          ) || [],
        applicableCategories:
          (editingCoupon.applicableCategories as any[])?.map((c) =>
            typeof c === "string" ? c : c._id
          ) || [],
        minPurchaseAmount: editingCoupon.minPurchaseAmount || 0,
        maxDiscountAmount: editingCoupon.maxDiscountAmount,
        usageLimit: editingCoupon.usageLimit,
        userUsageLimit: editingCoupon.userUsageLimit || 1,
        validFrom: new Date(editingCoupon.validFrom).toISOString().slice(0, 16),
        validUntil: new Date(editingCoupon.validUntil)
          .toISOString()
          .slice(0, 16),
        isActive: editingCoupon.isActive,
      });
    } else {
      // Reset for create mode
      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        applicableType: "all",
        applicableCourses: [],
        applicableCategories: [],
        minPurchaseAmount: 0,
        maxDiscountAmount: undefined,
        usageLimit: undefined,
        userUsageLimit: 1,
        validFrom: "",
        validUntil: "",
        isActive: true,
      });
    }
  }, [editingCoupon, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code?.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    if (
      formData.discountType === "percentage" &&
      formData.discountValue > 100
    ) {
      toast.error("Percentage discount cannot exceed 100");
      return;
    }

    if (!formData.validFrom || !formData.validUntil) {
      toast.error("Valid from and valid until dates are required");
      return;
    }

    if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      toast.error("Valid until date must be after valid from date");
      return;
    }

    try {
      let result;
      if (mode === "edit" && editingCoupon?._id) {
        result = await updateCoupon(editingCoupon._id, formData);
        if (result) {
          toast.success("Coupon updated successfully!");
          onSuccess?.(result);
          onClose();
        }
      } else {
        result = await createCoupon(formData as CreateCouponData);
        if (result) {
          toast.success("Coupon created successfully!");
          onSuccess?.(result);
          onClose();
        }
      }
    } catch (error) {
      console.error("Error saving coupon:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Tag className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === "edit" ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === "edit"
                  ? "Update coupon details"
                  : "Create a discount coupon for your courses"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>

            <Input
              label="Coupon Code"
              placeholder="e.g., SUMMER2024"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              required
              disabled={mode === "edit"}
            />

            <TextArea
              label="Description (Optional)"
              placeholder="Describe this coupon..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Discount Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Discount Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Discount Type"
                options={[
                  { value: "percentage", label: "Percentage (%)" },
                  { value: "fixed", label: "Fixed Amount (₹)" },
                ]}
                value={formData.discountType}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    discountType: value as "percentage" | "fixed",
                  })
                }
                placeholder="Select discount type"
              />

              <Input
                label="Discount Value"
                type="number"
                placeholder={
                  formData.discountType === "percentage"
                    ? "e.g., 20"
                    : "e.g., 500"
                }
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountValue: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Purchase Amount (₹)"
                type="number"
                placeholder="e.g., 1000"
                value={formData.minPurchaseAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minPurchaseAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />

              <Input
                label="Max Discount Amount (₹) (Optional)"
                type="number"
                placeholder="e.g., 2000"
                value={formData.maxDiscountAmount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDiscountAmount: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Applicability */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Applicability
            </h3>

            <Select
              label="Applies To"
              options={[
                { value: "all", label: "All Courses" },
                { value: "specific-courses", label: "Specific Courses" },
                { value: "specific-categories", label: "Specific Categories" },
              ]}
              value={formData.applicableType}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  applicableType: value as
                    | "all"
                    | "specific-courses"
                    | "specific-categories",
                })
              }
              placeholder="Select applicability"
            />

            {formData.applicableType === "specific-courses" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Courses
                </label>

                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Courses List with Infinite Scroll */}
                <div
                  ref={coursesScrollRef}
                  onScroll={handleCoursesScroll}
                  className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2"
                >
                  {(!courses || courses.length === 0) && !loadingCourses ? (
                    <p className="text-center text-gray-500 py-4">
                      {courseSearch
                        ? "No courses found"
                        : "No courses available"}
                    </p>
                  ) : (
                    <>
                      {courses &&
                        courses.map((course, index) => (
                          <CheckBoxContainer
                            key={index}
                            label={course.title}
                            checked={(
                              formData.applicableCourses || []
                            ).includes(course._id)}
                            onChange={(checked) => {
                              const current = formData.applicableCourses || [];
                              setFormData({
                                ...formData,
                                applicableCourses: checked
                                  ? [...current, course._id]
                                  : current.filter((id) => id !== course._id),
                              });
                            }}
                          />
                        ))}

                      {/* Loading indicator */}
                      {loadingCourses && (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                          <span className="ml-2 text-sm text-gray-600">
                            Loading courses...
                          </span>
                        </div>
                      )}

                      {/* End of list indicator */}
                      {!hasMoreCourses &&
                        courses &&
                        courses.length > 0 &&
                        !loadingCourses && (
                          <p className="text-center text-gray-400 text-xs py-2">
                            No more courses
                          </p>
                        )}
                    </>
                  )}
                </div>
              </div>
            )}

            {formData.applicableType === "specific-categories" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Categories
                </label>

                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Categories List with Infinite Scroll */}
                <div
                  ref={categoriesScrollRef}
                  onScroll={handleCategoriesScroll}
                  className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2"
                >
                  {(!categories || categories.length === 0) &&
                  !loadingCategories ? (
                    <p className="text-center text-gray-500 py-4">
                      {categorySearch
                        ? "No categories found"
                        : "No categories available"}
                    </p>
                  ) : (
                    <>
                      {categories &&
                        categories.map((category) => (
                          <CheckBoxContainer
                            key={category._id}
                            label={category.name}
                            checked={(
                              formData.applicableCategories || []
                            ).includes(category._id)}
                            onChange={(checked) => {
                              const current =
                                formData.applicableCategories || [];
                              setFormData({
                                ...formData,
                                applicableCategories: checked
                                  ? [...current, category._id]
                                  : current.filter((id) => id !== category._id),
                              });
                            }}
                          />
                        ))}

                      {/* Loading indicator */}
                      {loadingCategories && (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                          <span className="ml-2 text-sm text-gray-600">
                            Loading categories...
                          </span>
                        </div>
                      )}

                      {/* End of list indicator */}
                      {!hasMoreCategories &&
                        categories &&
                        categories.length > 0 &&
                        !loadingCategories && (
                          <p className="text-center text-gray-400 text-xs py-2">
                            No more categories
                          </p>
                        )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Usage Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Usage Limits
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Usage Limit (Optional)"
                type="number"
                placeholder="Unlimited"
                value={formData.usageLimit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
              />

              <Input
                label="Per User Usage Limit"
                type="number"
                placeholder="1"
                value={formData.userUsageLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    userUsageLimit: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          {/* Validity Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Validity Period
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valid From"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
                required
              />

              <Input
                label="Valid Until"
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData({ ...formData, validUntil: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Status */}
          <CheckBoxContainer
            label="Active"
            description="Enable this coupon for use"
            checked={formData.isActive}
            onChange={(checked) =>
              setFormData({ ...formData, isActive: checked })
            }
          />

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <OrangeButton
              type="submit"
              disabled={isLoading || loadingData}
              className="flex-1"
              glow={false}
            >
              {isLoading
                ? "Saving..."
                : mode === "edit"
                ? "Update Coupon"
                : "Create Coupon"}
            </OrangeButton>
            <WhiteButton
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </WhiteButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponModal;
