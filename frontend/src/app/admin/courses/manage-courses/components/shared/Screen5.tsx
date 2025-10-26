"use client";
import Container from "@/app/admin/components/ui/Container";
import Input from "@/components/ui/inputs/Input";
import { useState, useEffect } from "react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import DropDown from "@/components/ui/dropdown/DropDown";
import DateSelector from "@/components/ui/inputs/DateSelector";
import { Plan, Discount, PlanFeatures } from "@/types";
import { DollarSign, Percent, Plus, Trash2, List } from "lucide-react";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import { useFormContext, Controller } from "react-hook-form";
import { CourseFormData } from "@/types/courseForm";

interface CourseState {
  plans: {
    essential?: Plan;
    elite?: Plan;
  };
  discount?: Discount;
}

const Screen5 = () => {
  const [isMounted, setIsMounted] = useState(false);

  const {
    setValue,
    watch,
    control,
    formState: { errors },
  } = useFormContext<CourseFormData>();

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Watch form values
  const plansValue = watch("plans") || {};
  const discountValue = watch("discount");

  // Validation functions
  const validateStartDate = (date: Date | undefined) => {
    if (!date) return "Start date is required";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return "Start date cannot be before today";
    return true;
  };

  const validateEndDate = (
    endDate: Date | undefined,
    startDate: Date | undefined
  ) => {
    if (!endDate) return "End date is required";
    if (!startDate) return "Please select start date first";
    if (endDate < startDate) return "End date cannot be before start date";
    return true;
  };

  // State management
  const [state, setState] = useState<CourseState>({
    plans: {
      essential: {
        title: "",
        type: "essential",
        price: 0,
        features: [],
        isPopular: false,
        discount: {
          isActive: false,
          discount: "percentage",
          value: 0,
          startDate: new Date(),
          endDate: new Date(),
        },
      },
      elite: {
        title: "",
        type: "elite",
        price: 0,
        features: [],
        isPopular: false,
        discount: {
          isActive: false,
          discount: "percentage",
          value: 0,
          startDate: new Date(),
          endDate: new Date(),
        },
      },
    },
    discount: {
      isActive: false,
      discount: "percentage",
      value: 0,
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  // Plan visibility state
  const [showEssentialPlan, setShowEssentialPlan] = useState(true);
  const [showElitePlan, setShowElitePlan] = useState(false);

  // Sync state with form data
  useEffect(() => {
    if (isMounted) {
      if (plansValue.essential) {
        setState((prev) => ({
          ...prev,
          plans: {
            ...prev.plans,
            essential: plansValue.essential,
          },
        }));
        setShowEssentialPlan(true);
      }
      if (plansValue.elite) {
        setState((prev) => ({
          ...prev,
          plans: {
            ...prev.plans,
            elite: plansValue.elite,
          },
        }));
        setShowElitePlan(true);
      }
      if (discountValue) {
        setState((prev) => ({
          ...prev,
          discount: discountValue,
        }));
      }
    }
  }, [plansValue, discountValue, isMounted]);

  // Initialize form with plan data when component mounts
  useEffect(() => {
    if (isMounted) {
      // Initialize essential plan if it exists in form data
      if (plansValue.essential) {
        setState((prev) => ({
          ...prev,
          plans: {
            ...prev.plans,
            essential: plansValue.essential,
          },
        }));
        setShowEssentialPlan(true);
      } else {
        // Initialize with default essential plan if none exists
        const defaultEssentialPlan: Plan = {
          title: "",
          type: "essential",
          price: 0,
          features: [],
          isPopular: false,
          discount: {
            isActive: false,
            discount: "percentage",
            value: 0,
            startDate: new Date(),
            endDate: new Date(),
          },
        };
        setValue("plans.essential", defaultEssentialPlan, {
          shouldDirty: false,
          shouldTouch: false,
        });
      }

      // Initialize elite plan if it exists in form data
      if (plansValue.elite) {
        setState((prev) => ({
          ...prev,
          plans: {
            ...prev.plans,
            elite: plansValue.elite,
          },
        }));
        setShowElitePlan(true);
      }

      // Initialize global discount if it exists
      if (discountValue) {
        setState((prev) => ({
          ...prev,
          discount: discountValue,
        }));
      } else {
        // Initialize with default discount if none exists
        const defaultDiscount: Discount = {
          isActive: false,
          discount: "percentage",
          value: 0,
          startDate: new Date(),
          endDate: new Date(),
        };
        setValue("discount", defaultDiscount, {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    }
  }, [isMounted, setValue]);

  // Discount type options
  const discountTypeOptions = ["Percentage", "Fixed Amount"];

  // Plan management functions
  const addPlan = (planType: "essential" | "elite") => {
    const newPlan: Plan = {
      title: "",
      type: planType,
      price: 0,
      features: [],
      isPopular: false,
      discount: {
        isActive: false,
        discount: "percentage" as "percentage" | "fixed",
        value: 0,
        startDate: new Date(),
        endDate: new Date(),
      },
    };

    if (planType === "essential") {
      setShowEssentialPlan(true);
      setState((prev) => ({
        ...prev,
        plans: {
          ...prev.plans,
          essential: newPlan,
        },
      }));
      setValue("plans.essential", newPlan, {
        shouldDirty: true,
        shouldTouch: true,
      });
    } else if (planType === "elite") {
      setShowElitePlan(true);
      setState((prev) => ({
        ...prev,
        plans: {
          ...prev.plans,
          elite: newPlan,
        },
      }));
      setValue("plans.elite", newPlan, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const removePlan = (planType: "essential" | "elite") => {
    if (planType === "essential") {
      setShowEssentialPlan(false);
      setState((prev) => ({
        ...prev,
        plans: {
          ...prev.plans,
          essential: undefined,
        },
      }));
      setValue("plans.essential", undefined, {
        shouldDirty: true,
        shouldTouch: true,
      });
    } else if (planType === "elite") {
      setShowElitePlan(false);
      setState((prev) => ({
        ...prev,
        plans: {
          ...prev.plans,
          elite: undefined,
        },
      }));
      setValue("plans.elite", undefined, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const updatePlan = (
    planType: "essential" | "elite",
    field: keyof Plan,
    value: any
  ) => {
    const updatedPlan = {
      ...state.plans[planType],
      [field]: value,
    } as Plan;

    setState((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [planType]: updatedPlan,
      },
    }));

    setValue(`plans.${planType}`, updatedPlan, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const addFeatureToplan = (planType: "essential" | "elite") => {
    const newFeature: PlanFeatures = {
      title: "",
      provided: true,
    };

    const updatedPlan = {
      ...state.plans[planType],
      features: [...(state.plans[planType]?.features || []), newFeature],
    } as Plan;

    setState((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [planType]: updatedPlan,
      },
    }));

    setValue(`plans.${planType}`, updatedPlan, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const removeFeatureFromPlan = (
    planType: "essential" | "elite",
    index: number
  ) => {
    const updatedPlan = {
      ...state.plans[planType],
      features:
        state.plans[planType]?.features.filter((_, i) => i !== index) || [],
    } as Plan;

    setState((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [planType]: updatedPlan,
      },
    }));

    setValue(`plans.${planType}`, updatedPlan, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const updatePlanFeature = (
    planType: "essential" | "elite",
    index: number,
    field: keyof PlanFeatures,
    value: any
  ) => {
    const updatedPlan = {
      ...state.plans[planType],
      features:
        state.plans[planType]?.features.map((feature, i) =>
          i === index ? { ...feature, [field]: value } : feature
        ) || [],
    } as Plan;

    setState((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [planType]: updatedPlan,
      },
    }));

    setValue(`plans.${planType}`, updatedPlan, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const updateDiscount = (field: keyof Discount, value: any) => {
    const updatedDiscount = {
      ...state.discount,
      [field]: value,
    } as Discount;

    setState((prev) => ({
      ...prev,
      discount: updatedDiscount,
    }));

    setValue("discount", updatedDiscount, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const updatePlanDiscount = (
    planType: "essential" | "elite",
    field: keyof Discount,
    value: any
  ) => {
    const updatedPlan = {
      ...state.plans[planType],
      discount: {
        ...state.plans[planType]?.discount,
        [field]: value,
      } as Discount,
    } as Plan;

    setState((prev) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [planType]: updatedPlan,
      },
    }));

    setValue(`plans.${planType}`, updatedPlan, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  if (!isMounted) {
    return (
      <Container
        title="Pricing & Plans (Screen 5)"
        description="Set up pricing plans and discount options for your course"
        className="h-full w-full max-h-full overflow-y-auto flex flex-col"
        classNameBody="flex flex-col gap-6"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Pricing & Plans (Screen 5)"
      description="Set up pricing plans and discount options for your course"
      className="h-full w-full max-h-full overflow-y-auto flex flex-col"
      classNameBody="flex flex-col gap-6"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Plans Section */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Course Plans <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600">
                Configure pricing plans for your course (at least one plan
                required, Essential plan is sufficient)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!showEssentialPlan && (
              <OrangeButton
                onClick={() => addPlan("essential")}
                className="flex items-center gap-2 text-sm"
                glow={false}
              >
                <Plus className="w-4 h-4" />
                Add Essential Plan
              </OrangeButton>
            )}
            {!showElitePlan && (
              <OrangeButton
                onClick={() => addPlan("elite")}
                className="flex items-center gap-2 text-sm"
                glow={false}
              >
                <Plus className="w-4 h-4" />
                Add Elite Plan
              </OrangeButton>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Essential Plan */}
          {showEssentialPlan && state.plans?.essential && (
            <div
              className={`rounded-xl p-6 bg-white shadow-sm border border-gray-200`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                    Essential Plan
                  </h4>
                </div>
                <button
                  onClick={() => removePlan("essential")}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-6 flex-col md:flex-row">
                  <div className="flex-1">
                    <Input
                      label="Plan Title"
                      value={state.plans.essential.title || ""}
                      onChange={(e) =>
                        updatePlan("essential", "title", e.target.value)
                      }
                      placeholder="e.g., Essential Plan"
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Price ($)"
                      type="number"
                      value={state.plans.essential.price?.toString() || ""}
                      onChange={(e) =>
                        updatePlan(
                          "essential",
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      className="w-full"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Plan Features Section */}
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-1">
                        Plan Features <span className="text-red-500">*</span>
                      </h5>
                      <p className="text-xs text-gray-600">
                        Define what&apos;s included in this plan
                      </p>
                    </div>
                    <OrangeButton
                      onClick={() => addFeatureToplan("essential")}
                      className="flex items-center gap-2 text-xs px-3 py-2 h-8"
                      glow={false}
                    >
                      <Plus className="w-3 h-3" />
                      Add Feature
                    </OrangeButton>
                  </div>

                  {state.plans.essential.features.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-blue-200 rounded-xl bg-white/50">
                      <List className="w-10 h-10 mx-auto mb-3 text-blue-300" />
                      <p className="text-sm font-medium mb-1">
                        No features added yet
                      </p>
                      <p className="text-xs text-gray-400">
                        Click &quot;Add Feature&quot; to define what&apos;s
                        included
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {state.plans.essential.features.map((feature, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <Input
                                value={feature.title}
                                onChange={(e) =>
                                  updatePlanFeature(
                                    "essential",
                                    index,
                                    "title",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Lifetime access to course content"
                                className="w-full"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckBoxContainer
                                label="Included"
                                checked={feature.provided}
                                onChange={(checked) =>
                                  updatePlanFeature(
                                    "essential",
                                    index,
                                    "provided",
                                    checked
                                  )
                                }
                                className="text-xs cursor-pointer"
                              />
                              <button
                                onClick={() =>
                                  removeFeatureFromPlan("essential", index)
                                }
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all ml-2 cursor-pointer"
                                title="Remove feature"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plan-specific Discount Section */}
                <div className="bg-linear-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-1">
                        Plan Discount
                      </h5>
                      <p className="text-xs text-gray-600">
                        Optional discount specific to this plan
                      </p>
                    </div>
                    <CheckBoxContainer
                      label="Enable Plan Discount"
                      checked={
                        state.plans.essential.discount?.isActive || false
                      }
                      onChange={(checked) => {
                        if (checked) {
                          updatePlanDiscount("essential", "isActive", true);
                        } else {
                          // Reset discount values when disabled
                          const resetDiscount = {
                            isActive: false,
                            discount: "percentage" as "percentage" | "fixed",
                            value: 0,
                            startDate: new Date(),
                            endDate: new Date(),
                          };
                          updatePlan("essential", "discount", resetDiscount);
                        }
                      }}
                    />
                  </div>

                  {state.plans.essential.discount?.isActive && (
                    <div className="bg-white p-4 rounded-lg border border-amber-200">
                      <div className="flex gap-4 flex-col md:flex-row mb-4">
                        <div className="flex-1">
                          <DropDown
                            label="Discount Type"
                            value={
                              state.plans.essential.discount.discount ===
                              "percentage"
                                ? "Percentage"
                                : "Fixed Amount"
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              const mappedValue =
                                value === "Percentage" ? "percentage" : "fixed";
                              updatePlanDiscount(
                                "essential",
                                "discount",
                                mappedValue
                              );
                            }}
                            options={discountTypeOptions}
                            className="w-full"
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            label={`Discount Value ${
                              state.plans.essential.discount.discount ===
                              "percentage"
                                ? "(%)"
                                : "($)"
                            }`}
                            type="number"
                            value={
                              state.plans.essential.discount.value?.toString() ||
                              ""
                            }
                            onChange={(e) =>
                              updatePlanDiscount(
                                "essential",
                                "value",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            className="w-full"
                            required
                            min="0"
                            max={
                              state.plans.essential.discount.discount ===
                              "percentage"
                                ? "100"
                                : undefined
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 flex-col md:flex-row">
                        <div className="flex-1">
                          <Controller
                            name="plans.essential.discount.startDate"
                            control={control}
                            rules={{
                              required: "Start date is required",
                              validate: validateStartDate,
                            }}
                            render={({ field }) => (
                              <DateSelector
                                {...field}
                                label="Start Date"
                                value={field.value}
                                onChange={(date) => {
                                  field.onChange(date);
                                  updatePlanDiscount(
                                    "essential",
                                    "startDate",
                                    date
                                  );
                                }}
                                className="w-full"
                                required
                                minDate={new Date()}
                              />
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <Controller
                            name="plans.essential.discount.endDate"
                            control={control}
                            rules={{
                              required: "End date is required",
                              validate: (endDate) =>
                                validateEndDate(
                                  endDate,
                                  state.plans.essential?.discount?.startDate
                                ),
                            }}
                            render={({ field }) => (
                              <DateSelector
                                {...field}
                                label="End Date"
                                value={field.value}
                                onChange={(date) => {
                                  field.onChange(date);
                                  updatePlanDiscount(
                                    "essential",
                                    "endDate",
                                    date
                                  );
                                }}
                                className="w-full"
                                required
                                minDate={
                                  state.plans.essential?.discount?.startDate ||
                                  new Date()
                                }
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <CheckBoxContainer
                    label="Mark as Popular Plan"
                    checked={state.plans.essential.isPopular || false}
                    onChange={(checked) =>
                      updatePlan("essential", "isPopular", checked)
                    }
                    description="This plan will be highlighted and recommended to students"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Elite Plan */}
          {showElitePlan && state.plans?.elite && (
            <div
              className={`rounded-xl p-6 bg-white shadow-sm border border-gray-200`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-500" />
                    Elite Plan
                  </h4>
                </div>
                <button
                  onClick={() => removePlan("elite")}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-6 flex-col md:flex-row">
                  <div className="flex-1">
                    <Input
                      label="Plan Title"
                      value={state.plans.elite.title || ""}
                      onChange={(e) =>
                        updatePlan("elite", "title", e.target.value)
                      }
                      placeholder="e.g., Elite Plan"
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Price ($)"
                      type="number"
                      value={state.plans.elite.price?.toString() || ""}
                      onChange={(e) =>
                        updatePlan(
                          "elite",
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      className="w-full"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Plan Features Section */}
                <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-1">
                        Plan Features <span className="text-red-500">*</span>
                      </h5>
                      <p className="text-xs text-gray-600">
                        Define what&apos;s included in this plan
                      </p>
                    </div>
                    <OrangeButton
                      onClick={() => addFeatureToplan("elite")}
                      className="flex items-center gap-2 text-xs px-3 py-2 h-8"
                      glow={false}
                    >
                      <Plus className="w-3 h-3" />
                      Add Feature
                    </OrangeButton>
                  </div>

                  {state.plans.elite.features.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-purple-200 rounded-xl bg-white/50">
                      <List className="w-10 h-10 mx-auto mb-3 text-purple-300" />
                      <p className="text-sm font-medium mb-1">
                        No features added yet
                      </p>
                      <p className="text-xs text-gray-400">
                        Click &quot;Add Feature&quot; to define what&apos;s
                        included
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {state.plans.elite.features.map((feature, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg border border-purple-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <Input
                                value={feature.title}
                                onChange={(e) =>
                                  updatePlanFeature(
                                    "elite",
                                    index,
                                    "title",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Priority support and mentorship"
                                className="w-full"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <CheckBoxContainer
                                label="Included"
                                checked={feature.provided}
                                onChange={(checked) =>
                                  updatePlanFeature(
                                    "elite",
                                    index,
                                    "provided",
                                    checked
                                  )
                                }
                                className="text-xs"
                              />
                              <button
                                onClick={() =>
                                  removeFeatureFromPlan("elite", index)
                                }
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all ml-2"
                                title="Remove feature"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plan-specific Discount Section */}
                <div className="bg-linear-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-1">
                        Plan Discount
                      </h5>
                      <p className="text-xs text-gray-600">
                        Optional discount specific to this plan
                      </p>
                    </div>
                    <CheckBoxContainer
                      label="Enable Plan Discount"
                      checked={state.plans.elite.discount?.isActive || false}
                      onChange={(checked) => {
                        if (checked) {
                          updatePlanDiscount("elite", "isActive", true);
                        } else {
                          // Reset discount values when disabled
                          const resetDiscount = {
                            isActive: false,
                            discount: "percentage" as "percentage" | "fixed",
                            value: 0,
                            startDate: new Date(),
                            endDate: new Date(),
                          };
                          updatePlan("elite", "discount", resetDiscount);
                        }
                      }}
                    />
                  </div>

                  {state.plans.elite.discount?.isActive && (
                    <div className="bg-white p-4 rounded-lg border border-amber-200">
                      <div className="flex gap-4 flex-col md:flex-row mb-4">
                        <div className="flex-1">
                          <DropDown
                            label="Discount Type"
                            value={
                              state.plans.elite.discount.discount ===
                              "percentage"
                                ? "Percentage"
                                : "Fixed Amount"
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              const mappedValue =
                                value === "Percentage" ? "percentage" : "fixed";
                              updatePlanDiscount(
                                "elite",
                                "discount",
                                mappedValue
                              );
                            }}
                            options={discountTypeOptions}
                            className="w-full"
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            label={`Discount Value ${
                              state.plans.elite.discount.discount ===
                              "percentage"
                                ? "(%)"
                                : "($)"
                            }`}
                            type="number"
                            value={
                              state.plans.elite.discount.value?.toString() || ""
                            }
                            onChange={(e) =>
                              updatePlanDiscount(
                                "elite",
                                "value",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            className="w-full"
                            required
                            min="0"
                            max={
                              state.plans.elite.discount.discount ===
                              "percentage"
                                ? "100"
                                : undefined
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 flex-col md:flex-row">
                        <div className="flex-1">
                          <Controller
                            name="plans.elite.discount.startDate"
                            control={control}
                            rules={{
                              required: "Start date is required",
                              validate: validateStartDate,
                            }}
                            render={({ field }) => (
                              <DateSelector
                                {...field}
                                label="Start Date"
                                value={field.value}
                                onChange={(date) => {
                                  field.onChange(date);
                                  updatePlanDiscount(
                                    "elite",
                                    "startDate",
                                    date
                                  );
                                }}
                                className="w-full"
                                required
                                minDate={new Date()}
                              />
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <Controller
                            name="plans.elite.discount.endDate"
                            control={control}
                            rules={{
                              required: "End date is required",
                              validate: (endDate) =>
                                validateEndDate(
                                  endDate,
                                  state.plans.elite?.discount?.startDate
                                ),
                            }}
                            render={({ field }) => (
                              <DateSelector
                                {...field}
                                label="End Date"
                                value={field.value}
                                onChange={(date) => {
                                  field.onChange(date);
                                  updatePlanDiscount("elite", "endDate", date);
                                }}
                                className="w-full"
                                required
                                minDate={
                                  state.plans.elite?.discount?.startDate ||
                                  new Date()
                                }
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <CheckBoxContainer
                    label="Mark as Popular Plan"
                    checked={state.plans.elite.isPopular || false}
                    onChange={(checked) =>
                      updatePlan("elite", "isPopular", checked)
                    }
                    description="This plan will be highlighted and recommended to students"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discount Section */}
      <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Discount Settings
              </h3>
              <p className="text-sm text-gray-600">
                Optional discount configuration for your course plans
              </p>
            </div>
          </div>
          <CheckBoxContainer
            label="Enable Discount"
            checked={state.discount?.isActive || false}
            onChange={(checked) => {
              if (checked) {
                updateDiscount("isActive", true);
              } else {
                // Reset discount values when disabled
                const resetDiscount = {
                  isActive: false,
                  discount: "percentage" as "percentage" | "fixed",
                  value: 0,
                  startDate: new Date(),
                  endDate: new Date(),
                };
                setState((prev) => ({
                  ...prev,
                  discount: resetDiscount,
                }));
                setValue("discount", resetDiscount, {
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }
            }}
          />
        </div>

        {state.discount?.isActive && (
          <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
            <div className="flex gap-6 flex-col md:flex-row mb-6">
              <div className="flex-1">
                <DropDown
                  label="Discount Type"
                  value={
                    state.discount.discount === "percentage"
                      ? "Percentage"
                      : "Fixed Amount"
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    const mappedValue =
                      value === "Percentage" ? "percentage" : "fixed";
                    updateDiscount("discount", mappedValue);
                  }}
                  options={discountTypeOptions}
                  className="w-full"
                  required
                />
              </div>
              <div className="flex-1">
                <Input
                  label={`Discount Value ${
                    state.discount.discount === "percentage" ? "(%)" : "($)"
                  }`}
                  type="number"
                  value={state.discount.value?.toString() || ""}
                  onChange={(e) =>
                    updateDiscount("value", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="w-full"
                  required
                  min="0"
                  max={
                    state.discount.discount === "percentage" ? "100" : undefined
                  }
                />
              </div>
            </div>

            <div className="flex gap-6 flex-col md:flex-row">
              <div className="flex-1">
                <Controller
                  name="discount.startDate"
                  control={control}
                  rules={{
                    required: "Start date is required",
                    validate: validateStartDate,
                  }}
                  render={({ field }) => (
                    <DateSelector
                      {...field}
                      label="Start Date"
                      value={field.value}
                      onChange={(date) => {
                        field.onChange(date);
                        updateDiscount("startDate", date);
                      }}
                      className="w-full"
                      required
                      minDate={new Date()}
                    />
                  )}
                />
              </div>
              <div className="flex-1">
                <Controller
                  name="discount.endDate"
                  control={control}
                  rules={{
                    required: "End date is required",
                    validate: (endDate) =>
                      validateEndDate(endDate, state.discount?.startDate),
                  }}
                  render={({ field }) => (
                    <DateSelector
                      {...field}
                      label="End Date"
                      value={field.value}
                      onChange={(date) => {
                        field.onChange(date);
                        updateDiscount("endDate", date);
                      }}
                      className="w-full"
                      required
                      minDate={state.discount?.startDate || new Date()}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Screen5;
