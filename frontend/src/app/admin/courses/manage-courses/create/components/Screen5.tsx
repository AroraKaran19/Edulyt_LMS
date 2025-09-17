import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useMemo, useState } from "react";
import { useCourseContext } from "../../../reducers/course/providers/CourseReducerProvider";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";
import DropDown from "@/components/ui/dropdown/DropDown";
import DateSelector from "@/components/ui/inputs/DateSelector";
import ScreenNavigation from "./shared/ScreenNavigation";
import { Plan, Discount, PlanFeatures } from "@/types";
import { DollarSign, Percent, Plus, Trash2, List } from "lucide-react";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";

const Screen5 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const [showElitePlan, setShowElitePlan] = useState(
    !!state.course.plans?.elite
  );
  const [showEssentialPlan, setShowEssentialPlan] = useState(
    !!state.course.plans?.essential
  );

  // Discount type options
  const discountTypeOptions = ["Percentage", "Fixed Amount"];

  // Helper function to create a new plan
  const createNewPlan = (type: "elite" | "essential"): Plan => ({
    title: type === "elite" ? "Elite Plan" : "Essential Plan",
    price: 0,
    type: type,
    features: [
      { title: "Access to course content", provided: true },
      { title: "Certificate of completion", provided: true },
    ],
    isActive: true,
    isPopular: false,
  });

  // Helper function to update plan with popular plan logic
  const updatePlan = (
    planType: "elite" | "essential",
    field: keyof Plan,
    value: any
  ) => {
    const currentPlans = state.course.plans || {};
    const currentPlan = currentPlans[planType] || createNewPlan(planType);

    const updatedPlan = {
      ...currentPlan,
      [field]: value,
    };

    // If setting isPopular to true, ensure only one plan can be popular
    if (field === "isPopular" && value === true) {
      const otherPlanType = planType === "elite" ? "essential" : "elite";
      const otherPlan = currentPlans[otherPlanType];
      if (otherPlan) {
        const updatedOtherPlan = { ...otherPlan, isPopular: false };
        const updatedPlans = {
          ...currentPlans,
          [planType]: updatedPlan,
          [otherPlanType]: updatedOtherPlan,
        };
        actions.setCoursePlans(updatedPlans);
        return;
      }
    }

    const updatedPlans = {
      ...currentPlans,
      [planType]: updatedPlan,
    };

    actions.setCoursePlans(updatedPlans);
  };

  // Helper function to remove plan
  const removePlan = (planType: "elite" | "essential") => {
    const currentPlans = state.course.plans || {};
    const updatedPlans = { ...currentPlans };
    delete updatedPlans[planType];

    actions.setCoursePlans(updatedPlans);

    if (planType === "elite") {
      setShowElitePlan(false);
    } else {
      setShowEssentialPlan(false);
    }
  };

  // Helper function to add plan
  const addPlan = (planType: "elite" | "essential") => {
    const currentPlans = state.course.plans || {};
    const newPlan = createNewPlan(planType);

    const updatedPlans = {
      ...currentPlans,
      [planType]: newPlan,
    };

    actions.setCoursePlans(updatedPlans);

    if (planType === "elite") {
      setShowElitePlan(true);
    } else {
      setShowEssentialPlan(true);
    }
  };

  // Helper function to add a new feature to a plan
  const addFeatureToplan = (planType: "elite" | "essential") => {
    const currentPlans = state.course.plans || {};
    const currentPlan = currentPlans[planType];
    if (currentPlan) {
      const newFeature: PlanFeatures = {
        title: "",
        provided: true,
      };
      const updatedFeatures = [...(currentPlan.features || []), newFeature];
      updatePlan(planType, "features", updatedFeatures);
    }
  };

  // Helper function to remove a feature from a plan
  const removeFeatureFromPlan = (
    planType: "elite" | "essential",
    featureIndex: number
  ) => {
    const currentPlans = state.course.plans || {};
    const currentPlan = currentPlans[planType];
    if (currentPlan) {
      const updatedFeatures = currentPlan.features.filter(
        (_, index) => index !== featureIndex
      );
      updatePlan(planType, "features", updatedFeatures);
    }
  };

  // Helper function to update a specific feature
  const updatePlanFeature = (
    planType: "elite" | "essential",
    featureIndex: number,
    field: keyof PlanFeatures,
    value: any
  ) => {
    const currentPlans = state.course.plans || {};
    const currentPlan = currentPlans[planType];
    if (currentPlan) {
      const updatedFeatures = currentPlan.features.map((feature, index) =>
        index === featureIndex ? { ...feature, [field]: value } : feature
      );
      updatePlan(planType, "features", updatedFeatures);
    }
  };

  // Helper function to update discount
  const updateDiscount = (field: keyof Discount, value: any) => {
    const currentDiscount = state.course.discount || {
      discount: "percentage",
      value: 0,
      startDate: new Date(),
      endDate: new Date(),
      isActive: false,
    };

    const updatedDiscount = {
      ...currentDiscount,
      [field]: value,
    };

    actions.setCourseDiscount(updatedDiscount);
  };

  // Enhanced validation with detailed checks
  const planValidation = useMemo(() => {
    const plans = state.course.plans;
    const validation = {
      isValid: false,
      errors: [] as string[],
      planErrors: {
        essential: [] as string[],
        elite: [] as string[],
      },
    };

    // Check if at least one plan exists
    if (!plans || (!plans.elite && !plans.essential)) {
      validation.errors.push("At least one pricing plan is required");
      return validation;
    }

    // Validate each existing plan
    let hasValidPlan = false;

    Object.entries(plans).forEach(([planType, plan]) => {
      if (!plan) return;

      const planErrors: string[] = [];
      let planIsValid = true;

      // Check plan title
      if (!plan.title?.trim()) {
        planErrors.push("Plan title is required");
        planIsValid = false;
      }

      // Check plan price - must be greater than 0
      if (typeof plan.price !== "number" || plan.price <= 0) {
        planErrors.push("Price must be greater than 0");
        planIsValid = false;
      }

      // Check plan features
      if (!plan.features || plan.features.length === 0) {
        planErrors.push("At least one feature is required");
        planIsValid = false;
      } else {
        // Check if all features have titles
        const invalidFeatures = plan.features.filter(
          (feature) => !feature.title?.trim()
        );
        if (invalidFeatures.length > 0) {
          planErrors.push(
            `${invalidFeatures.length} feature(s) missing description`
          );
          planIsValid = false;
        }

        // Check if all features have valid provided field
        const invalidProvidedFields = plan.features.filter(
          (feature) => typeof feature.provided !== "boolean"
        );
        if (invalidProvidedFields.length > 0) {
          planErrors.push("All features must have valid inclusion status");
          planIsValid = false;
        }
      }

      // Store plan-specific errors
      validation.planErrors[planType as keyof typeof validation.planErrors] =
        planErrors;

      if (planIsValid) {
        hasValidPlan = true;
      }
    });

    // Discount validation (if discount is active)
    const discount = state.course.discount;
    if (discount && discount.isActive) {
      // Check discount value - can't be 0
      if (typeof discount.value !== "number" || discount.value <= 0) {
        validation.errors.push("Discount value must be greater than 0");
      }

      // Check discount dates - end date must be after start date
      if (discount.startDate && discount.endDate) {
        const startDate = new Date(discount.startDate);
        const endDate = new Date(discount.endDate);

        if (endDate <= startDate) {
          validation.errors.push("Discount end date must be after start date");
        }
      } else {
        if (!discount.startDate) {
          validation.errors.push("Discount start date is required");
        }
        if (!discount.endDate) {
          validation.errors.push("Discount end date is required");
        }
      }
    }

    // Overall validation
    if (!hasValidPlan) {
      validation.errors.push("At least one plan must be complete and valid");
    }

    validation.isValid = hasValidPlan && validation.errors.length === 0;
    return validation;
  }, [state.course.plans, state.course.discount]);

  const isFormValid = planValidation.isValid;

  return (
    <Container
      title="Pricing & Plans"
      description="Set up pricing plans and discount options for your course"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Validation Errors */}
      {planValidation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <h4 className="text-red-800 font-semibold">Validation Errors</h4>
          </div>
          <ul className="space-y-1">
            {planValidation.errors.map((error, index) => (
              <li
                key={index}
                className="text-red-700 text-sm flex items-center gap-2"
              >
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Plans Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
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
          {showEssentialPlan && state.course.plans?.essential && (
            <div
              className={`rounded-xl p-6 bg-white shadow-sm border ${
                planValidation.planErrors.essential.length > 0
                  ? "border-red-300 bg-red-50/30"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                    Essential Plan
                  </h4>
                  {planValidation.planErrors.essential.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-200 rounded-lg">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-red-700 text-xs font-medium">
                        {planValidation.planErrors.essential.length} error(s)
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removePlan("essential")}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Essential Plan Errors */}
              {planValidation.planErrors.essential.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <h5 className="text-red-800 font-medium text-sm mb-2">
                    Issues with this plan:
                  </h5>
                  <ul className="space-y-1">
                    {planValidation.planErrors.essential.map((error, index) => (
                      <li
                        key={index}
                        className="text-red-700 text-xs flex items-center gap-2"
                      >
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-6">
                <FlexBox className="gap-6 flex-col md:flex-row">
                  <div className="flex-1">
                    <Input
                      label="Plan Title"
                      value={state.course.plans.essential.title || ""}
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
                      value={
                        state.course.plans.essential.price?.toString() || ""
                      }
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
                </FlexBox>

                {/* Plan Features Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-1">
                        Plan Features <span className="text-red-500">*</span>
                      </h5>
                      <p className="text-xs text-gray-600">
                        Define what's included in this plan
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

                  {state.course.plans.essential.features.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-blue-200 rounded-xl bg-white/50">
                      <List className="w-10 h-10 mx-auto mb-3 text-blue-300" />
                      <p className="text-sm font-medium mb-1">
                        No features added yet
                      </p>
                      <p className="text-xs text-gray-400">
                        Click "Add Feature" to define what's included
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {state.course.plans.essential.features.map(
                        (feature, index) => (
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
                              <div className="flex items-center gap-2 mt-2">
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
                                  className="text-xs"
                                />
                                <button
                                  onClick={() =>
                                    removeFeatureFromPlan("essential", index)
                                  }
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all ml-2"
                                  title="Remove feature"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <CheckBoxContainer
                    label="Mark as Popular Plan"
                    checked={state.course.plans.essential.isPopular || false}
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
          {showElitePlan && state.course.plans?.elite && (
            <div
              className={`rounded-xl p-6 bg-white shadow-sm border ${
                planValidation.planErrors.elite.length > 0
                  ? "border-red-300 bg-red-50/30"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-500" />
                    Elite Plan
                  </h4>
                  {planValidation.planErrors.elite.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-200 rounded-lg">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-red-700 text-xs font-medium">
                        {planValidation.planErrors.elite.length} error(s)
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removePlan("elite")}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Elite Plan Errors */}
              {planValidation.planErrors.elite.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <h5 className="text-red-800 font-medium text-sm mb-2">
                    Issues with this plan:
                  </h5>
                  <ul className="space-y-1">
                    {planValidation.planErrors.elite.map((error, index) => (
                      <li
                        key={index}
                        className="text-red-700 text-xs flex items-center gap-2"
                      >
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-6">
                <FlexBox className="gap-6 flex-col md:flex-row">
                  <div className="flex-1">
                    <Input
                      label="Plan Title"
                      value={state.course.plans.elite.title || ""}
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
                      value={state.course.plans.elite.price?.toString() || ""}
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
                </FlexBox>

                {/* Plan Features Section */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-1">
                        Plan Features <span className="text-red-500">*</span>
                      </h5>
                      <p className="text-xs text-gray-600">
                        Define what's included in this plan
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

                  {state.course.plans.elite.features.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-purple-200 rounded-xl bg-white/50">
                      <List className="w-10 h-10 mx-auto mb-3 text-purple-300" />
                      <p className="text-sm font-medium mb-1">
                        No features added yet
                      </p>
                      <p className="text-xs text-gray-400">
                        Click "Add Feature" to define what's included
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {state.course.plans.elite.features.map(
                        (feature, index) => (
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
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <CheckBoxContainer
                    label="Mark as Popular Plan"
                    checked={state.course.plans.elite.isPopular || false}
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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-100">
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
            checked={state.course.discount?.isActive || false}
            onChange={(checked) => updateDiscount("isActive", checked)}
          />
        </div>

        {state.course.discount?.isActive && (
          <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
            <FlexBox className="gap-6 flex-col md:flex-row mb-6">
              <div className="flex-1">
                <DropDown
                  label="Discount Type"
                  value={
                    state.course.discount.discount === "percentage"
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
                    state.course.discount.discount === "percentage"
                      ? "(%)"
                      : "($)"
                  }`}
                  type="number"
                  value={state.course.discount.value?.toString() || ""}
                  onChange={(e) =>
                    updateDiscount("value", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="w-full"
                  required
                  min="0"
                  max={
                    state.course.discount.discount === "percentage"
                      ? "100"
                      : undefined
                  }
                />
              </div>
            </FlexBox>

            <FlexBox className="gap-6 flex-col md:flex-row">
              <div className="flex-1">
                <DateSelector
                  label="Start Date"
                  value={state.course.discount.startDate}
                  onChange={(date) => updateDiscount("startDate", date)}
                  className="w-full"
                  required
                />
              </div>
              <div className="flex-1">
                <DateSelector
                  label="End Date"
                  value={state.course.discount.endDate}
                  onChange={(date) => updateDiscount("endDate", date)}
                  className="w-full"
                  required
                />
              </div>
            </FlexBox>
          </div>
        )}
      </div>

      <ScreenNavigation
        currentStep={5}
        previousScreen="screen4"
        nextScreen="screen6"
        setActiveScreen={setActiveScreen}
        isNextDisabled={!isFormValid}
      />
    </Container>
  );
};

export default Screen5;
