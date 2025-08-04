import Container from "@/app/admin/components/ui/Container";
import FlexBox from "@/components/ui/FlexBox";
import Input from "@/components/ui/inputs/Input";
import React, { useState, useRef } from "react";
import { useCourseContext } from "../../../course-reducer/CourseReducerProvider";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { useScreen } from "../contexts/ScreenContext";
import DropDown from "@/components/ui/dropdown/DropDown";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import { Plan } from "@/types/course";

// Feature templates for quick selection
const FEATURE_TEMPLATES = {
  'Content Access': [
    'Access to all course videos',
    'Downloadable resources',
    'Course completion certificate',
    'Mobile app access'
  ],
  'Support & Community': [
    'Community forum access',
    'Email support',
    '24/7 chat support',
    'Live Q&A sessions',
    'One-on-one mentoring'
  ],
  'Advanced Features': [
    'Lifetime access',
    'Bonus materials',
    'Advanced assignments',
    'Project reviews',
    'Career guidance'
  ],
  'Learning Tools': [
    'Progress tracking',
    'Quiz assessments',
    'Interactive exercises',
    'Study guides',
    'Flashcards'
  ]
};

// Feature Card Component
const FeatureCard = ({ 
  feature, 
  index, 
  planType, 
  onRemove, 
  onEdit, 
  onToggleProvided 
}: {
  feature: { title: string; provided: boolean };
  index: number;
  planType: 'essential' | 'elite';
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
    <div className={`bg-white border-2 rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
      feature.provided ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={() => onToggleProvided(index)}
            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              feature.provided 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
          >
            {feature.provided && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
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
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p 
                className={`text-sm cursor-pointer hover:text-orange-600 transition-colors ${
                  feature.provided ? 'text-gray-800' : 'text-gray-500 line-through'
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove feature"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Feature Template Selector
const FeatureTemplateSelector = ({ 
  onAddFeatures, 
  planType 
}: { 
  onAddFeatures: (features: string[]) => void;
  planType: 'essential' | 'elite';
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTemplate = (categoryFeatures: string[]) => {
    onAddFeatures(categoryFeatures);
    setIsOpen(false);
    setSelectedCategory('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Add from Templates
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Feature Templates</h3>
            <p className="text-sm text-gray-600">Choose a category to add common features</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(FEATURE_TEMPLATES).map(([category, features]) => (
              <div key={category} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-gray-800">{category}</h4>
                    <p className="text-sm text-gray-600">{features.length} features</p>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${selectedCategory === category ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {selectedCategory === category && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2 mb-3">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAddTemplate(features)}
                      className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm"
                    >
                      Add All {features.length} Features
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              Close
            </button>
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
  onUpdateFeatures 
}: {
  planType: 'essential' | 'elite';
  features: { title: string; provided: boolean }[];
  onUpdateFeatures: (features: { title: string; provided: boolean }[]) => void;
}) => {
  const [newFeature, setNewFeature] = useState('');

  const addFeature = (title: string) => {
    if (title.trim()) {
      const updatedFeatures = [...features, { title: title.trim(), provided: true }];
      onUpdateFeatures(updatedFeatures);
      setNewFeature('');
    }
  };

  const addMultipleFeatures = (titles: string[]) => {
    const newFeatures = titles.map(title => ({ title, provided: true }));
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

  const providedCount = features.filter(f => f.provided).length;
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
            if (e.key === 'Enter') {
              addFeature(newFeature);
            }
          }}
        />
        <button
          onClick={() => addFeature(newFeature)}
          disabled={!newFeature.trim()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {/* Feature list */}
      <div className="space-y-3">
        {features.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p>No features added yet</p>
            <p className="text-sm">Add features manually or use templates above</p>
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
              style={{ width: `${totalCount > 0 ? (providedCount / totalCount) * 100 : 0}%` }}
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

  // Helper function to check if a plan is valid and active
  const isPlanValidAndActive = (plan: any) => {
    return plan && 
           plan.isActive && 
           plan.title?.trim() && 
           plan.price > 0 && 
           plan.billingPeriod && 
           plan.features && 
           plan.features.length > 0;
  };

  // Check if at least one plan is active and valid
  const hasAtLeastOneActivePlan = () => {
    const essentialValid = isPlanValidAndActive(state.course.plans?.essential);
    const eliteValid = isPlanValidAndActive(state.course.plans?.elite);
    return essentialValid || eliteValid;
  };

  // Helper function to create a valid plan object
  const createValidPlan = (
    planType: "essential" | "elite", 
    updates: Partial<Plan>
  ): Plan => {
    const existingPlan = state.course.plans?.[planType];
    const defaultTitle = planType === "essential" ? "Essential Plan" : "Elite Plan";
    
    return {
      title: existingPlan?.title || defaultTitle,
      type: planType,
      price: existingPlan?.price || 0,
      features: existingPlan?.features || [],
      isActive: existingPlan?.isActive ?? true,
      isPopular: planType === "elite" ? (existingPlan?.isPopular ?? false) : false,
      ...updates
    };
  };

  // Display error if present
  const renderError = () => {
    if (state.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{state.error}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Display info message about plan requirements
  const renderPlanRequirement = () => {
    if (!hasAtLeastOneActivePlan()) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Plan Requirement</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>At least one plan must be active and fully configured to proceed. Make sure to:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Set a plan title</li>
                  <li>Set a price greater than 0</li>
                  <li>Choose a billing period</li>
                  <li>Add at least one feature</li>
                  <li>Mark the plan as active</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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
      
      {/* Plan Status Indicators */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isPlanValidAndActive(state.course.plans?.essential) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-sm font-medium">Essential Plan {isPlanValidAndActive(state.course.plans?.essential) ? '(Active)' : '(Inactive)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isPlanValidAndActive(state.course.plans?.elite) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-sm font-medium">Elite Plan {isPlanValidAndActive(state.course.plans?.elite) ? '(Active)' : '(Inactive)'}</span>
        </div>
      </div>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <Input
          label="Essential Plan Title"
          name="essentialTitle"
          placeholder="Enter title for essential plan"
          value={state.course.plans?.essential?.title || ""}
                            onChange={(e) => {
            const validPlan = createValidPlan("essential", { title: e.target.value });
            actions.updateCoursePlan("essential", validPlan);
          }}
          className="w-full"
          required
        />
        <Input
          label="Elite Plan Title"
          name="eliteTitle"
          placeholder="Enter title for elite plan"
          value={state.course.plans?.elite?.title || ""}
                            onChange={(e) => {
            const validPlan = createValidPlan("elite", { title: e.target.value });
            actions.updateCoursePlan("elite", validPlan);
          }}
          className="w-full"
          required
        />
      </FlexBox>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <Input
          label="Essential Plan Price"
          name="essentialPrice"
          placeholder="Enter price for essential plan"
          value={state.course.plans?.essential?.price?.toString() || ""}
          onChange={(e) => {
            const price = e.target.value === "" ? 0 : Number(e.target.value);
            if (!isNaN(price)) {
              const validPlan = createValidPlan("essential", { price });
              actions.updateCoursePlan("essential", validPlan);
            }
          }}
          className="w-full"
          required
        />
        <Input
          label="Elite Plan Price"
          name="elitePrice"
          placeholder="Enter price for elite plan"
          value={state.course.plans?.elite?.price?.toString() || ""}
          onChange={(e) => {
            const price = e.target.value === "" ? 0 : Number(e.target.value);
            if (!isNaN(price)) {
              const validPlan = createValidPlan("elite", { price });
              actions.updateCoursePlan("elite", validPlan);
            }
          }}
          className="w-full"
          required
        />
      </FlexBox>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <DropDown
          label="Essential Plan Billing"
          name="essentialBilling"
          options={["monthly", "annually", "lifetime"]}
          defaultValue={state.course.plans?.essential?.billingPeriod || "Select billing period"}
          onChange={(e) => {
            const validPlan = createValidPlan("essential", {
              billingPeriod: e.target.value as "monthly" | "annually" | "lifetime"
            });
            actions.updateCoursePlan("essential", validPlan);
          }}
          required
        />
        <DropDown
          label="Elite Plan Billing"
          name="eliteBilling"
          options={["monthly", "annually", "lifetime"]}
          defaultValue={state.course.plans?.elite?.billingPeriod || "Select billing period"}
          onChange={(e) => {
            const validPlan = createValidPlan("elite", {
              billingPeriod: e.target.value as "monthly" | "annually" | "lifetime"
            });
            actions.updateCoursePlan("elite", validPlan);
          }}
          required
        />
      </FlexBox>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <Input
          label="Essential Plan Trial Days (Optional)"
          name="essentialTrialDays"
          placeholder="Enter trial days"
          value={state.course.plans?.essential?.trialDays?.toString() || ""}
          onChange={(e) => {
            const value = e.target.value.trim();
            const trialDays = value === "" ? undefined : Number(value);
            if (value === "" || !isNaN(trialDays!)) {
              const validPlan = createValidPlan("essential", { trialDays });
              actions.updateCoursePlan("essential", validPlan);
            }
          }}
          className="w-full"
          required={false}
        />
        <Input
          label="Elite Plan Trial Days (Optional)"
          name="eliteTrialDays"
          placeholder="Enter trial days"
          value={state.course.plans?.elite?.trialDays?.toString() || ""}
          onChange={(e) => {
            const value = e.target.value.trim();
            const trialDays = value === "" ? undefined : Number(value);
            if (value === "" || !isNaN(trialDays!)) {
              const validPlan = createValidPlan("elite", { trialDays });
              actions.updateCoursePlan("elite", validPlan);
            }
          }}
          className="w-full"
          required={false}
        />
      </FlexBox>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <CheckBoxContainer
          label="Essential Plan Active"
          checked={state.course.plans?.essential?.isActive || false}
          onChange={(checked) => {
            actions.updateCoursePlan("essential", {
              ...state.course.plans?.essential,
              title: state.course.plans?.essential?.title || "Essential Plan",
              type: "essential" as const,
              price: state.course.plans?.essential?.price || 0,
              features: state.course.plans?.essential?.features || [],
              isActive: checked,
            });
          }}
          className="w-full"
        />
        <CheckBoxContainer
          label="Elite Plan Active"
          checked={state.course.plans?.elite?.isActive || false}
          onChange={(checked) => {
            actions.updateCoursePlan("elite", {
              ...state.course.plans?.elite,
              title: state.course.plans?.elite?.title || "Elite Plan",
              type: "elite" as const,
              price: state.course.plans?.elite?.price || 0,
              features: state.course.plans?.elite?.features || [],
              isActive: checked,
            });
          }}
          className="w-full"
        />
      </FlexBox>

      <FlexBox className="w-full gap-8 flex-col md:flex-row">
        <CheckBoxContainer
          label="Elite Plan is Popular"
          checked={state.course.plans?.elite?.isPopular || false}
          onChange={(checked) => {
            actions.updateCoursePlan("elite", {
              ...state.course.plans?.elite,
              title: state.course.plans?.elite?.title || "Elite Plan",
              type: "elite" as const,
              price: state.course.plans?.elite?.price || 0,
              features: state.course.plans?.elite?.features || [],
              isPopular: checked,
              isActive: state.course.plans?.elite?.isActive ?? true,
            });
          }}
          className="w-full"
        />
      </FlexBox>

      {/* Enhanced Feature Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <FeatureManager
            planType="essential"
            features={state.course.plans?.essential?.features || []}
            onUpdateFeatures={(features) => {
              const validPlan = createValidPlan("essential", { features });
              actions.updateCoursePlan("essential", validPlan);
            }}
          />
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <FeatureManager
            planType="elite"
            features={state.course.plans?.elite?.features || []}
            onUpdateFeatures={(features) => {
              const validPlan = createValidPlan("elite", { features });
              actions.updateCoursePlan("elite", validPlan);
            }}
          />
        </div>
      </div>

      {/* Feature Comparison Preview */}
      {((state.course.plans?.essential?.features?.length || 0) > 0 || (state.course.plans?.elite?.features?.length || 0) > 0) && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
            </svg>
            Feature Comparison Preview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Essential Plan Preview */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">
                  {state.course.plans?.essential?.title || 'Essential Plan'}
                </h4>
                <span className="text-2xl font-bold text-orange-600">
                  ${state.course.plans?.essential?.price || 0}
                </span>
              </div>
              <div className="space-y-2">
                {(state.course.plans?.essential?.features || []).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {feature.provided ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={feature.provided ? 'text-gray-700' : 'text-gray-400 line-through'}>
                      {feature.title}
                    </span>
                  </div>
                ))}
                {(state.course.plans?.essential?.features || []).length === 0 && (
                  <p className="text-gray-400 text-sm italic">No features added yet</p>
                )}
              </div>
            </div>

            {/* Elite Plan Preview */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">
                  {state.course.plans?.elite?.title || 'Elite Plan'}
                </h4>
                <span className="text-2xl font-bold text-orange-600">
                  ${state.course.plans?.elite?.price || 0}
                </span>
              </div>
              <div className="space-y-2">
                {(state.course.plans?.elite?.features || []).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {feature.provided ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={feature.provided ? 'text-gray-700' : 'text-gray-400 line-through'}>
                      {feature.title}
                    </span>
                  </div>
                ))}
                {(state.course.plans?.elite?.features || []).length === 0 && (
                  <p className="text-gray-400 text-sm italic">No features added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <FlexBox className="w-full gap-4 mt-auto mb-4 justify-between">
        <OrangeButton
          className="w-max px-16"
          onClick={() => setActiveScreen("screen3")}
        >
          Previous
        </OrangeButton>
        <OrangeButton
          className="w-max px-16"
          onClick={() => setActiveScreen("screen5")}
          disabled={!hasAtLeastOneActivePlan()}
        >
          Next Page
        </OrangeButton>
      </FlexBox>
    </Container>
  );
};

export default Screen4; 