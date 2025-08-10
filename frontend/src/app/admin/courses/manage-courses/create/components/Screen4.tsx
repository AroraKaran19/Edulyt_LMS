import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useState } from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Button } from "@/components/ui/buttons/button";
import { useScreen } from "../contexts/ScreenContext";
import DropDown from "@/components/ui/dropdown/DropDown";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import AlertBanner from "@/components/ui/AlertBanner";
import { Plan } from "@/types/course";
import {
  Check,
  X,
  Edit3,
  Trash2,
  Archive,
  ChevronDown,
  Eye,
  EyeOff,
  DollarSign,
  BarChart3,
  FileText,
} from "lucide-react";

// Feature templates for quick selection
const FEATURE_TEMPLATES = {
  "Content Access": [
    "Access to all course videos",
    "Downloadable resources",
    "Course completion certificate",
    "Mobile app access",
  ],
  "Support & Community": [
    "Community forum access",
    "Email support",
    "24/7 chat support",
    "Live Q&A sessions",
    "One-on-one mentoring",
  ],
  "Advanced Features": [
    "Lifetime access",
    "Bonus materials",
    "Advanced assignments",
    "Project reviews",
    "Career guidance",
  ],
  "Learning Tools": [
    "Progress tracking",
    "Quiz assessments",
    "Interactive exercises",
    "Study guides",
    "Flashcards",
  ],
};

// Feature Card Component
const FeatureCard = ({
  feature,
  index,
  planType,
  onRemove,
  onEdit,
  onToggleProvided,
}: {
  feature: { title: string; provided: boolean };
  index: number;
  planType: "essential" | "elite";
  onRemove: (index: number) => void;
  onEdit: (index: number, newTitle: string) => void;
  onToggleProvided: (index: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(feature.title);

  const handleSave = () => {
    if (editValue.trim()) {
      onEdit(index, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(feature.title);
    setIsEditing(false);
  };

  return (
    <div
      className={`bg-white border-2 rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
        feature.provided
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={() => onToggleProvided(index)}
            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              feature.provided
                ? "bg-green-500 border-green-500 text-white"
                : "bg-white border-gray-300 hover:border-gray-400"
            }`}
          >
            {feature.provided && <Check className="w-3 h-3" />}
          </button>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="px-2 py-1 text-xs bg-green-500 text-white hover:bg-green-600"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="secondary"
                    size="sm"
                    className="px-2 py-1 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className={`text-sm cursor-pointer hover:text-orange-600 transition-colors ${
                  feature.provided
                    ? "text-gray-800"
                    : "text-gray-500 line-through"
                }`}
                onClick={() => setIsEditing(true)}
              >
                {feature.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
            title="Edit feature"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove feature"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Feature Template Selector
const FeatureTemplateSelector = ({
  onAddFeatures,
  planType,
}: {
  onAddFeatures: (features: string[]) => void;
  planType: "essential" | "elite";
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTemplate = (categoryFeatures: string[]) => {
    onAddFeatures(categoryFeatures);
    setIsOpen(false);
    setSelectedCategory("");
  };

  return (
    <div className="relative">
      <OrangeButton
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Archive className="w-4 h-4" />
        Add from Templates
      </OrangeButton>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Feature Templates</h3>
            <p className="text-sm text-gray-600">
              Choose a category to add common features
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(FEATURE_TEMPLATES).map(([category, features]) => (
              <div
                key={category}
                className="border-b border-gray-100 last:border-b-0"
              >
                <button
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category ? "" : category
                    )
                  }
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-800">{category}</h4>
                    <p className="text-sm text-gray-600">
                      {features.length} features
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedCategory === category ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {selectedCategory === category && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2 mb-3">
                      {features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <Check className="w-4 h-4 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <OrangeButton
                      onClick={() => handleAddTemplate(features)}
                      className="w-full text-sm"
                    >
                      Add All {features.length} Features
                    </OrangeButton>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <WhiteButton
              onClick={() => setIsOpen(false)}
              className="w-full text-sm"
            >
              Close
            </WhiteButton>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Feature Manager
const FeatureManager = ({
  planType,
  features = [],
  onUpdateFeatures,
}: {
  planType: "essential" | "elite";
  features: { title: string; provided: boolean }[];
  onUpdateFeatures: (features: { title: string; provided: boolean }[]) => void;
}) => {
  const [newFeature, setNewFeature] = useState("");

  const addFeature = (title: string) => {
    if (title.trim()) {
      const updatedFeatures = [
        ...features,
        { title: title.trim(), provided: true },
      ];
      onUpdateFeatures(updatedFeatures);
      setNewFeature("");
    }
  };

  const addMultipleFeatures = (titles: string[]) => {
    const newFeatures = titles.map((title) => ({ title, provided: true }));
    const updatedFeatures = [...features, ...newFeatures];
    onUpdateFeatures(updatedFeatures);
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = features.filter((_, i) => i !== index);
    onUpdateFeatures(updatedFeatures);
  };

  const editFeature = (index: number, newTitle: string) => {
    const updatedFeatures = features.map((feature, i) =>
      i === index ? { ...feature, title: newTitle } : feature
    );
    onUpdateFeatures(updatedFeatures);
  };

  const toggleFeatureProvided = (index: number) => {
    const updatedFeatures = features.map((feature, i) =>
      i === index ? { ...feature, provided: !feature.provided } : feature
    );
    onUpdateFeatures(updatedFeatures);
  };

  const providedCount = features.filter((f) => f.provided).length;
  const totalCount = features.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 capitalize">
            {planType} Plan Features
          </h3>
          <p className="text-sm text-gray-600">
            {providedCount} of {totalCount} features included
          </p>
        </div>
        <div className="flex gap-2">
          <FeatureTemplateSelector
            onAddFeatures={addMultipleFeatures}
            planType={planType}
          />
        </div>
      </div>

      {/* Add new feature */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          placeholder="Add a new feature..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addFeature(newFeature);
            }
          }}
        />
        <OrangeButton
          onClick={() => addFeature(newFeature)}
          disabled={!newFeature.trim()}
          className="px-4 py-2"
        >
          Add
        </OrangeButton>
      </div>

      {/* Feature list */}
      <div className="space-y-3">
        {features.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No features added yet</p>
            <p className="text-sm">
              Add features manually or use templates above
            </p>
          </div>
        ) : (
          features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              index={index}
              planType={planType}
              onRemove={removeFeature}
              onEdit={editFeature}
              onToggleProvided={toggleFeatureProvided}
            />
          ))
        )}
      </div>

      {/* Feature statistics */}
      {features.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Feature Status</span>
            <span className="text-gray-800 font-medium">
              {providedCount}/{totalCount} included
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  totalCount > 0 ? (providedCount / totalCount) * 100 : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

const Screen4 = () => {
  const { state, actions } = useCourseContext();
  const { setActiveScreen } = useScreen();
  const [activeTab, setActiveTab] = useState<"essential" | "elite">(
    "essential"
  );
  const [showPreview, setShowPreview] = useState(false);

  // Helper function to check if a plan is valid and active
  const isPlanValidAndActive = (plan: any) => {
    return (
      plan &&
      plan.isActive &&
      plan.title?.trim() &&
      plan.price > 0 &&
      plan.billingPeriod &&
      plan.features &&
      plan.features.length > 0
    );
  };

  // Check if at least one plan is active and valid
  const hasAtLeastOneActivePlan = () => {
    const essentialValid = isPlanValidAndActive(state.course.plans?.essential);
    const eliteValid = isPlanValidAndActive(state.course.plans?.elite);
    return essentialValid || eliteValid;
  };

  // Get plan completion percentage
  const getPlanCompletion = (planType: "essential" | "elite") => {
    const plan = state.course.plans?.[planType];
    const checks = [
      plan?.title?.trim(),
      plan?.price && plan.price > 0,
      plan?.billingPeriod,
      plan?.features && plan.features.length > 0,
      plan?.isActive,
    ];
    const completed = checks.filter(Boolean).length;
    return (completed / checks.length) * 100;
  };

  // Helper function to create a valid plan object
  const createValidPlan = (
    planType: "essential" | "elite",
    updates: Partial<Plan>
  ): Plan => {
    const existingPlan = state.course.plans?.[planType];
    const defaultTitle =
      planType === "essential" ? "Essential Plan" : "Elite Plan";

    // Preserve all existing plan fields and only override with provided updates
    return {
      // Start with existing plan data
      ...existingPlan,
      // Ensure required fields have defaults
      title: existingPlan?.title || defaultTitle,
      type: planType,
      price: existingPlan?.price || 0,
      features: existingPlan?.features || [],
      isActive: existingPlan?.isActive ?? true,
      isPopular:
        planType === "elite" ? existingPlan?.isPopular ?? false : false,
      // Apply updates last to override defaults
      ...updates,
    };
  };

  // Display error if present
  const renderError = () => {
    if (state.error) {
      return (
        <AlertBanner
          message={`Validation Error: ${state.error}`}
          type="error"
          className="mb-6 bg-red-50 border border-red-200"
        />
      );
    }
    return null;
  };

  // Display info message about plan requirements
  const renderPlanRequirement = () => {
    if (!hasAtLeastOneActivePlan()) {
      return (
        <AlertBanner
          message="Complete at least one plan with title, price, billing period, features, and active status to proceed"
          type="info"
          className="mb-6"
        />
      );
    }
    return null;
  };

  return (
    <Container
      title="Pricing & Plans"
      description="Set up pricing plans and features for your course"
      className="rounded-b-none h-full w-full max-h-full overflow-y-auto flex flex-col"
      style={{ scrollbarWidth: "thin" }}
    >
      {renderError()}
      {renderPlanRequirement()}

      {/* Enhanced Header with Progress */}
      <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Configure Your Plans
            </h2>
            <p className="text-gray-600">
              Create pricing tiers to maximize your course revenue
            </p>
          </div>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            className="flex items-center gap-2"
          >
            {showPreview ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>

        {/* Plan Progress Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["essential", "elite"] as const).map((planType) => {
            const completion = getPlanCompletion(planType);
            const isValid = isPlanValidAndActive(
              state.course.plans?.[planType]
            );

            return (
              <div
                key={planType}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isValid ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="font-medium capitalize">
                      {planType} Plan
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {Math.round(completion)}% complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      completion === 100 ? "bg-green-500" : "bg-orange-500"
                    }`}
                    style={{ width: `${completion}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isValid ? "Ready to publish" : "Needs configuration"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(["essential", "elite"] as const).map((planType) => (
          <Button
            key={planType}
            onClick={() => setActiveTab(planType)}
            variant={activeTab === planType ? "default" : "ghost"}
            className={`px-6 py-3 font-medium capitalize ${
              activeTab === planType
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {planType} Plan
            {isPlanValidAndActive(state.course.plans?.[planType]) && (
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
            )}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Plan Configuration Form */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 capitalize">
                {activeTab} Plan Settings
              </h3>
              <p className="text-sm text-gray-600">
                Configure pricing and billing for your {activeTab} plan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Plan Info */}
            <div className="space-y-4">
              <Input
                label="Plan Title"
                name={`${activeTab}Title`}
                placeholder={`Enter title for ${activeTab} plan`}
                value={state.course.plans?.[activeTab]?.title || ""}
                onChange={(e) => {
                  const validPlan = createValidPlan(activeTab, {
                    title: e.target.value,
                  });
                  actions.updateCoursePlan(activeTab, validPlan);
                }}
                className="w-full"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price ($)"
                  name={`${activeTab}Price`}
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    state.course.plans?.[activeTab]?.price?.toString() || ""
                  }
                  onChange={(e) => {
                    const price =
                      e.target.value === "" ? 0 : Number(e.target.value);
                    if (!isNaN(price)) {
                      const validPlan = createValidPlan(activeTab, { price });
                      actions.updateCoursePlan(activeTab, validPlan);
                    }
                  }}
                  className="w-full"
                  required
                />

                <Input
                  label="Trial Days"
                  name={`${activeTab}TrialDays`}
                  placeholder="Optional"
                  type="number"
                  min="0"
                  value={
                    state.course.plans?.[activeTab]?.trialDays?.toString() || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    const trialDays = value === "" ? undefined : Number(value);
                    if (value === "" || !isNaN(trialDays!)) {
                      const validPlan = createValidPlan(activeTab, {
                        trialDays,
                      });
                      actions.updateCoursePlan(activeTab, validPlan);
                    }
                  }}
                  className="w-full"
                  required={false}
                />
              </div>
            </div>

            {/* Billing & Status */}
            <div className="space-y-4">
              <DropDown
                label="Billing Period"
                name={`${activeTab}Billing`}
                options={["monthly", "annually", "lifetime"]}
                value={
                  state.course.plans?.[activeTab]?.billingPeriod ||
                  "Select billing period"
                }
                onChange={(e) => {
                  const validPlan = createValidPlan(activeTab, {
                    billingPeriod: e.target.value as
                      | "monthly"
                      | "annually"
                      | "lifetime",
                  });
                  actions.updateCoursePlan(activeTab, validPlan);
                }}
                required
              />

              <div className="space-y-3">
                <CheckBoxContainer
                  label="Plan is Active"
                  checked={state.course.plans?.[activeTab]?.isActive || false}
                  onChange={(checked) => {
                    const validPlan = createValidPlan(activeTab, {
                      isActive: checked,
                    });
                    actions.updateCoursePlan(activeTab, validPlan);
                  }}
                  className="w-full"
                />

                {activeTab === "elite" && (
                  <CheckBoxContainer
                    label="Mark as Popular (Recommended badge)"
                    checked={state.course.plans?.elite?.isPopular || false}
                    onChange={(checked) => {
                      const validPlan = createValidPlan("elite", {
                        isPopular: checked,
                      });
                      actions.updateCoursePlan("elite", validPlan);
                    }}
                    className="w-full"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="p-6">
          <FeatureManager
            planType={activeTab}
            features={state.course.plans?.[activeTab]?.features || []}
            onUpdateFeatures={(features) => {
              const validPlan = createValidPlan(activeTab, { features });
              actions.updateCoursePlan(activeTab, validPlan);
            }}
          />
        </div>
      </div>

      {/* Enhanced Preview Section */}
      {showPreview &&
        ((state.course.plans?.essential?.features?.length || 0) > 0 ||
          (state.course.plans?.elite?.features?.length || 0) > 0) && (
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Live Preview
                  </h3>
                  <p className="text-sm text-gray-600">
                    See how your plans will appear to customers
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
                Preview Mode
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(["essential", "elite"] as const).map((planType) => {
                const plan = state.course.plans?.[planType];
                const isValid = isPlanValidAndActive(plan);

                return (
                  <div
                    key={planType}
                    className={`bg-white rounded-xl p-6 border-2 transition-all ${
                      isValid
                        ? "border-green-200 shadow-lg"
                        : "border-gray-200 shadow-sm opacity-75"
                    } ${
                      planType === "elite" && plan?.isPopular
                        ? "relative ring-2 ring-orange-500"
                        : ""
                    }`}
                  >
                    {planType === "elite" && plan?.isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-800 capitalize mb-2">
                        {plan?.title || `${planType} Plan`}
                      </h4>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan?.price || 0}
                        </span>
                        <span className="text-sm text-gray-500">
                          /{plan?.billingPeriod || "month"}
                        </span>
                      </div>
                      {plan?.trialDays && (
                        <p className="text-sm text-green-600 font-medium">
                          {plan.trialDays} days free trial
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      {(plan?.features || []).map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              feature.provided
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {feature.provided ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              feature.provided
                                ? "text-gray-700"
                                : "text-gray-400 line-through"
                            }`}
                          >
                            {feature.title}
                          </span>
                        </div>
                      ))}
                      {(!plan?.features || plan.features.length === 0) && (
                        <div className="text-center py-4">
                          <p className="text-gray-400 text-sm italic">
                            No features added yet
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      className={`w-full py-3 px-4 font-medium ${
                        planType === "elite" && plan?.isPopular
                          ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                      disabled={!isValid}
                      variant={
                        planType === "elite" && plan?.isPopular
                          ? "default"
                          : "secondary"
                      }
                    >
                      {isValid ? "Choose Plan" : "Plan Incomplete"}
                    </Button>

                    {!isValid && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Complete all required fields to activate
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Enhanced Navigation */}
      <FlexBox className="w-full gap-4 mt-8 pt-6 border-t border-gray-200 justify-between items-center">
        <OrangeButton
          className="w-max px-16"
          onClick={() => setActiveScreen("screen3")}
        >
          Previous
        </OrangeButton>

        <FlexBox className="gap-4 items-center">
          {/* Progress indicator */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
            <span>Step 4 of 8</span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: "50%" }}
              ></div>
            </div>
          </div>

          <OrangeButton
            onClick={() => setActiveScreen("screen5")}
            disabled={!hasAtLeastOneActivePlan()}
            className="w-max px-16"
          >
            Next Page
          </OrangeButton>
        </FlexBox>
      </FlexBox>

      {!hasAtLeastOneActivePlan() && (
        <div className="mt-3 text-center">
          <AlertBanner
            message="Complete at least one plan to continue"
            type="warning"
            className="inline-block"
          />
        </div>
      )}
    </Container>
  );
};

export default Screen4;
