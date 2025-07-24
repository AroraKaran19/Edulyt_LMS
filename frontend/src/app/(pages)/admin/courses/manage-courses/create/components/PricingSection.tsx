"use client";
import React, { useState, useCallback, useMemo } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { 
  DollarSign, 
  Plus, 
  X, 
  Star, 
  Check, 
  Edit3, 
  Trash2, 
  Crown,
  Shield,
  Calendar,
  Clock,
  Zap,
  Gift,
  Package,
  Sparkles,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseFormContext } from "../context/CourseFormContext";
import { Plan, PlanFeatures } from "@/types/course";

// Move PlanCard component outside to prevent recreation on every render
const PlanCard = ({ 
  planType, 
  plan, 
  editingPlan, 
  planData,
  newFeature,
  isFormValid,
  onEditPlan, 
  onDeletePlan, 
  onSavePlan, 
  onResetForm,
  onPlanDataChange,
  onNewFeatureChange,
  onAddFeature,
  onRemoveFeature
}: {
  planType: 'elite' | 'essential';
  plan: Plan | undefined;
  editingPlan: 'elite' | 'essential' | null;
  planData: Partial<Plan>;
  newFeature: Partial<PlanFeatures>;
  isFormValid: boolean | string | undefined;
  onEditPlan: (planType: 'elite' | 'essential') => void;
  onDeletePlan: (planType: 'elite' | 'essential') => void;
  onSavePlan: () => void;
  onResetForm: () => void;
  onPlanDataChange: (field: keyof Plan, value: string | number | boolean | PlanFeatures[]) => void;
  onNewFeatureChange: (field: keyof PlanFeatures, value: string | boolean) => void;
  onAddFeature: () => void;
  onRemoveFeature: (index: number) => void;
}) => {
  const hasPlan = plan && plan.title;
  const isEditing = editingPlan === planType;

  return (
    <div className="bg-white border-2 border-[#F77124] rounded-2xl overflow-hidden shadow-[0_0_2px_4px_rgba(247,113,36,0.3)] hover:shadow-[0_0_4px_6px_rgba(247,113,36,0.4)] transition-all duration-300">
      {/* Plan Header */}
      <div className={cn(
        "p-6 border-b border-[#FFE9DB]",
        planType === 'elite' 
          ? "bg-gradient-to-r from-[#F77124]/10 via-[#F5691D]/5 to-[#FFE9DB]" 
          : "bg-gradient-to-r from-[#FFE9DB] via-[#F77124]/5 to-[#F77124]/10"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border-2",
              planType === 'elite' 
                ? "bg-[#F77124] border-[#F5691D] text-white" 
                : "bg-[#FFE9DB] border-[#F77124] text-[#F77124]"
            )}>
              {planType === 'elite' ? (
                <Crown className="w-6 h-6" />
              ) : (
                <Shield className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2B1508] capitalize font-coolvetica">
                {planType} Plan
              </h3>
              <p className="text-sm text-[#2B1508]/70 font-medium">
                {planType === 'elite' ? 'Premium tier with exclusive features' : 'Essential features for all students'}
              </p>
            </div>
          </div>
          
          {hasPlan && (
            <div className="flex items-center gap-2">
              {plan.isPopular && (
                <div className="flex items-center gap-1 px-3 py-1 bg-[#F77124] text-white rounded-full text-xs font-bold shadow-[0_0_2px_3px_rgba(247,113,36,0.3)]">
                  <Star className="w-3 h-3 fill-current" />
                  Popular
                </div>
              )}
              <div className={cn(
                "w-3 h-3 rounded-full border border-white shadow-sm",
                plan.isActive ? "bg-[#24F795]" : "bg-gray-400"
              )} />
            </div>
          )}
        </div>
      </div>

      {/* Plan Content */}
      <div className="p-6">
        {hasPlan && !isEditing ? (
          /* Plan Display */
          <div className="space-y-6">
            {/* Price Display */}
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-4xl font-bold text-[#2B1508] font-coolvetica">₹{plan.price}</span>
                {plan.billingPeriod !== 'lifetime' && (
                  <span className="text-[#2B1508]/60 text-sm font-medium">
                    /{plan.billingPeriod === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>
              <h4 className="text-lg font-bold text-[#2B1508] mb-2 font-coolvetica">{plan.title}</h4>
              
              {/* Billing Info */}
              <div className="flex items-center justify-center gap-4 text-xs text-[#2B1508]/70 font-medium">
                {plan.billingPeriod === 'lifetime' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#FFE9DB] rounded-full">
                    <Zap className="w-3 h-3 text-[#F77124]" />
                    <span>Lifetime access</span>
                  </div>
                )}
                {plan.trialDays && plan.trialDays > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#24F795]/20 rounded-full">
                    <Gift className="w-3 h-3 text-[#24F795]" />
                    <span>{plan.trialDays} days trial</span>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            {plan.features && plan.features.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#F77124]" />
                  <span className="text-sm font-bold text-[#2B1508] font-coolvetica">Features</span>
                  <span className="text-xs text-[#2B1508]/60 bg-[#FFE9DB] px-2 py-0.5 rounded-full font-medium">
                    {plan.features.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border",
                        feature.provided 
                          ? "bg-[#24F795] border-[#24F795]" 
                          : "bg-gray-100 border-gray-300"
                      )}>
                        {feature.provided ? (
                          <Check className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <X className="w-2.5 h-2.5 text-gray-400" />
                        )}
                      </div>
                      <span className={cn(
                        "font-medium",
                        feature.provided ? "text-[#2B1508]" : "text-[#2B1508]/40 line-through"
                      )}>
                        {feature.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-[#FFE9DB]">
              <button
                type="button"
                onClick={() => onEditPlan(planType)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#F77124] text-[#F77124] rounded-2xl hover:bg-[#FFE9DB] transition-all duration-300 text-sm font-bold"
              >
                <Edit3 className="w-4 h-4" />
                Edit Plan
              </button>
              <button
                type="button"
                onClick={() => onDeletePlan(planType)}
                className="px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors text-sm font-bold shadow-[0_0_2px_3px_rgba(239,68,68,0.3)]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : isEditing ? (
          /* Plan Form */
          <div className="space-y-6">
            {/* Form Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-[#2B1508] font-coolvetica">
                {hasPlan ? 'Edit' : 'Create'} {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
              </h4>
              <button
                type="button"
                onClick={onResetForm}
                className="text-sm text-[#2B1508]/60 hover:text-[#F77124] font-medium transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#2B1508] font-coolvetica">
                <Package className="w-4 h-4 text-[#F77124]" />
                Basic Information
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B1508] mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    placeholder="Premium Access"
                    value={planData.title || ''}
                    onChange={(e) => onPlanDataChange('title', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B1508] mb-2">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#F77124] font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="99.99"
                      value={planData.price || ''}
                      onChange={(e) => onPlanDataChange('price', Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B1508] mb-2">
                    <Calendar className="w-3 h-3 inline mr-1 text-[#F77124]" />
                    Billing
                  </label>
                  <select
                    value={planData.billingPeriod || 'lifetime'}
                    onChange={(e) => onPlanDataChange('billingPeriod', e.target.value as 'lifetime' | 'annually' | 'monthly')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] outline-none bg-white transition-all"
                  >
                    <option value="lifetime">Lifetime</option>
                    <option value="annually">Annual</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B1508] mb-2">
                    <Clock className="w-3 h-3 inline mr-1 text-[#F77124]" />
                    Trial Days (Not Implemented Yet)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={planData.trialDays || ''}
                    onChange={(e) => onPlanDataChange('trialDays', Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B1508] mb-2">
                    <Settings className="w-3 h-3 inline mr-1 text-[#F77124]" />
                    Options
                  </label>
                  <div className="space-y-2">
                                         <label className="flex items-center gap-2">
                       <input
                         type="checkbox"
                         checked={Boolean(planData.isPopular)}
                         onChange={(e) => onPlanDataChange('isPopular', e.target.checked)}
                         className="rounded border-gray-300 text-[#F77124] focus:ring-[#F77124] w-4 h-4"
                       />
                       <span className="text-xs font-medium text-[#2B1508]">Popular</span>
                     </label>
                     <label className="flex items-center gap-2">
                       <input
                         type="checkbox"
                         checked={Boolean(planData.isActive ?? true)}
                         onChange={(e) => onPlanDataChange('isActive', e.target.checked)}
                         className="rounded border-gray-300 text-[#F77124] focus:ring-[#F77124] w-4 h-4"
                       />
                       <span className="text-xs font-medium text-[#2B1508]">Active</span>
                     </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#2B1508] font-coolvetica">
                  <Check className="w-4 h-4 text-[#F77124]" />
                  Features
                </div>
                {planData.features && planData.features.length > 0 && (
                  <span className="text-xs text-[#2B1508]/60 bg-[#FFE9DB] px-2 py-1 rounded-full font-medium">
                    {planData.features.length} feature{planData.features.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {/* Add Feature */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a feature..."
                  value={newFeature.title || ''}
                  onChange={(e) => onNewFeatureChange('title', e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] outline-none transition-all"
                />
                <select
                  value={newFeature.provided?.toString() || 'true'}
                  onChange={(e) => onNewFeatureChange('provided', e.target.value === 'true')}
                  className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F77124] focus:border-[#F77124] outline-none bg-white transition-all"
                >
                  <option value="true">✓</option>
                  <option value="false">✗</option>
                </select>
                <button
                  type="button"
                  onClick={onAddFeature}
                  disabled={!newFeature.title?.trim()}
                  className="px-3 py-2 bg-[#F77124] text-white rounded-lg hover:bg-[#F5691D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold shadow-[0_0_2px_3px_rgba(247,113,36,0.3)]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Features List */}
              {planData.features && planData.features.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                  {planData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FFE9DB]/30 group transition-all">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border",
                        feature.provided 
                          ? "bg-[#24F795] border-[#24F795]" 
                          : "bg-red-100 border-red-300"
                      )}>
                        {feature.provided ? (
                          <Check className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <X className="w-2.5 h-2.5 text-red-600" />
                        )}
                      </div>
                      <span className={cn(
                        "flex-1 text-sm font-medium",
                        feature.provided ? "text-[#2B1508]" : "text-[#2B1508]/40 line-through"
                      )}>
                        {feature.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveFeature(index)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-[#FFE9DB]">
              <button
                type="button"
                onClick={onSavePlan}
                disabled={!isFormValid}
                className="flex items-center gap-2 px-6 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-[0_0_2px_3px_rgba(247,113,36,0.3)]"
              >
                <Check className="w-4 h-4" />
                {hasPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-8">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2",
              planType === 'elite' 
                ? "bg-[#F77124]/10 border-[#F77124]/30" 
                : "bg-[#FFE9DB] border-[#F77124]/30"
            )}>
              {planType === 'elite' ? (
                <Crown className="w-8 h-8 text-[#F77124]" />
              ) : (
                <Shield className="w-8 h-8 text-[#F77124]" />
              )}
            </div>
            <h4 className="text-lg font-bold text-[#2B1508] mb-2 font-coolvetica">
              No {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
            </h4>
            <p className="text-sm text-[#2B1508]/70 mb-6 font-medium">
              Create a {planType} plan to offer different pricing tiers
            </p>
            <button
              type="button"
              onClick={() => onEditPlan(planType)}
              className="flex items-center gap-2 px-4 py-3 bg-[#F77124] text-white rounded-2xl hover:bg-[#F5691D] transition-all font-bold mx-auto text-sm shadow-[0_0_2px_3px_rgba(247,113,36,0.3)]"
            >
              <Plus className="w-4 h-4" />
              Create {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const PricingSection = () => {
  const {
    state,
    setPlan,
    removePlan,
  } = useCourseFormContext();

  const [editingPlan, setEditingPlan] = useState<'elite' | 'essential' | null>(null);
  
  const [planData, setPlanData] = useState<Partial<Plan>>({
    _id: '',
    title: '',
    type: 'elite',
    price: 0,
    features: [],
    isPopular: false,
    billingPeriod: 'lifetime',
    trialDays: 0,
    isActive: true,
  });

  const [newFeature, setNewFeature] = useState<Partial<PlanFeatures>>({
    title: '',
    provided: true,
  });

  // Memoize event handlers to prevent recreation on every render
  const handlePlanDataChange = useCallback((field: keyof Plan, value: string | number | boolean | PlanFeatures[]) => {
    setPlanData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNewFeatureChange = useCallback((field: keyof PlanFeatures, value: string | boolean) => {
    setNewFeature(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddFeature = useCallback(() => {
    if (newFeature.title?.trim()) {
      const feature: PlanFeatures = {
        title: newFeature.title,
        provided: newFeature.provided ?? true,
      };
      setPlanData(prev => ({
        ...prev,
        features: [...(prev.features || []), feature]
      }));
      setNewFeature({
        title: '',
        provided: true,
      });
    }
  }, [newFeature]);

  const handleRemoveFeature = useCallback((index: number) => {
    setPlanData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const handleSavePlan = useCallback(() => {
    if (planData.title && planData.price !== undefined && editingPlan) {
      const planToSave: Plan = {
        _id: planData._id || Date.now().toString(),
        title: planData.title,
        type: editingPlan,
        price: Number(planData.price),
        features: planData.features || [],
        isPopular: Boolean(planData.isPopular),
        billingPeriod: planData.billingPeriod || 'lifetime',
        trialDays: planData.trialDays || 0,
        isActive: Boolean(planData.isActive ?? true),
        createdAt: planData.createdAt || new Date(),
        updatedAt: new Date(),
      };

      setPlan(editingPlan, planToSave);
      // resetForm();
    }
  }, [planData, editingPlan, setPlan]);

  const handleEditPlan = useCallback((planType: 'elite' | 'essential') => {
    const plan = state.plans[planType];
    if (plan && plan.title) {
      setPlanData(plan);
      setEditingPlan(planType);
    } else {
      // Create new plan
      setPlanData({
        _id: '',
        title: '',
        type: planType,
        price: 0,
        features: [],
        isPopular: false,
        billingPeriod: 'lifetime',
        trialDays: 0,
        isActive: true,
      });
      setEditingPlan(planType);
    }
  }, [state.plans]);

  const handleDeletePlan = useCallback((planType: 'elite' | 'essential') => {
    removePlan(planType);
    if (editingPlan === planType) {
      // resetForm();
    }
  }, [removePlan, editingPlan]);



  const isFormValid = useMemo(() => {
    return planData.title && planData.price !== undefined;
  }, [planData.title, planData.price]);

  return (
    <Container
      id="pricing"
      icon={DollarSign}
      title="Pricing Plans"
      description="Design competitive pricing strategies to maximize student enrollment"
    >
      <div className="space-y-6">
        {/* Plans Overview */}
        <div className="bg-gradient-to-r from-[#FFE9DB] via-[#F77124]/10 to-[#FFE9DB] rounded-2xl p-6 border-2 border-[#F77124]/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#2B1508] mb-1 font-coolvetica">Course Pricing Strategy</h3>
              <p className="text-sm text-[#2B1508]/70 font-medium">
                Configure both Elite and Essential plans to maximize revenue and accessibility
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full border border-white",
                  state.plans.elite?.title ? "bg-[#24F795]" : "bg-gray-300"
                )} />
                <span className="text-[#2B1508] font-medium">Elite Plan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full border border-white",
                  state.plans.essential?.title ? "bg-[#24F795]" : "bg-gray-300"
                )} />
                <span className="text-[#2B1508] font-medium">Essential Plan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlanCard 
            planType="elite" 
            plan={state.plans.elite}
            editingPlan={editingPlan}
            planData={planData}
            newFeature={newFeature}
            isFormValid={isFormValid}
            onEditPlan={handleEditPlan}
            onDeletePlan={handleDeletePlan}
            onSavePlan={handleSavePlan}
            onResetForm={resetForm}
            onPlanDataChange={handlePlanDataChange}
            onNewFeatureChange={handleNewFeatureChange}
            onAddFeature={handleAddFeature}
            onRemoveFeature={handleRemoveFeature}
          />
          <PlanCard 
            planType="essential" 
            plan={state.plans.essential}
            editingPlan={editingPlan}
            planData={planData}
            newFeature={newFeature}
            isFormValid={isFormValid}  // TODO: Fix this
            onEditPlan={handleEditPlan}
            onDeletePlan={handleDeletePlan}
            onSavePlan={handleSavePlan}
            onResetForm={resetForm}
            onPlanDataChange={handlePlanDataChange}
            onNewFeatureChange={handleNewFeatureChange}
            onAddFeature={handleAddFeature}
            onRemoveFeature={handleRemoveFeature}
          />
        </div>

        {/* Quick Actions */}
        {!editingPlan && (
          <div className="bg-[#FFF6F2] rounded-2xl p-6 border border-[#F77124]/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#2B1508] mb-1 font-coolvetica">Quick Actions</h4>
                <p className="text-xs text-[#2B1508]/70 font-medium">Manage your pricing plans efficiently</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEditPlan('elite')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#F77124] hover:bg-[#FFE9DB] rounded-lg transition-all font-bold"
                >
                  <Crown className="w-4 h-4" />
                  {state.plans.elite?.title ? 'Edit Elite' : 'Add Elite'}
                </button>
                <button
                  type="button"
                  onClick={() => handleEditPlan('essential')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#F77124] hover:bg-[#FFE9DB] rounded-lg transition-all font-bold"
                >
                  <Shield className="w-4 h-4" />
                  {state.plans.essential?.title ? 'Edit Essential' : 'Add Essential'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default PricingSection; 
const resetForm = () => {};
