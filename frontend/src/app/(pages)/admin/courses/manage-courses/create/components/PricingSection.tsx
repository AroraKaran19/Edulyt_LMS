"use client";
import React, { useState } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { DollarSign, Plus, X, Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseFormState, useCourseFormContext } from "../context/CourseFormContext";
import { Plan } from "@/types/course";

const PricingSection = () => {
  const {
    state,
    addPlan,
    removePlan,
    updateArrayItem,
  } = useCourseFormContext();

  const [activeTab, setActiveTab] = useState<'elite' | 'essential'>('elite');
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
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

  const [newFeature, setNewFeature] = useState({
    title: '',
    provided: true,
    description: '',
    order: 0,
  });

  const [editingPlan, setEditingPlan] = useState<{ type: 'elite' | 'essential', index: number } | null>(null);

  const handleAddFeature = () => {
    if (newFeature.title.trim()) {
      const feature = {
        ...newFeature,
        order: newPlan.features?.length || 0,
      };
      setNewPlan(prev => ({
        ...prev,
        features: [...(prev.features || []), feature]
      }));
      setNewFeature({
        title: '',
        provided: true,
        description: '',
        order: 0,
      });
    }
  };

  const removeFeature = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddPlan = () => {
    if (newPlan.title && newPlan.price !== undefined) {
      const planToAdd: Plan = {
        _id: Date.now().toString(),
        title: newPlan.title!,
        type: activeTab,
        price: Number(newPlan.price),
        features: newPlan.features || [],
        isPopular: newPlan.isPopular || false,
        billingPeriod: newPlan.billingPeriod || 'lifetime',
        trialDays: newPlan.trialDays || 0,
        isActive: newPlan.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingPlan) {
        updateArrayItem(`plans.${editingPlan.type}` as keyof CourseFormState, editingPlan.index, planToAdd);
        setEditingPlan(null);
      } else {
        addPlan(activeTab, planToAdd);
      }

      // Reset form
      setNewPlan({
        _id: '',
        title: '',
        type: activeTab,
        price: 0,
        features: [],
        isPopular: false,
        billingPeriod: 'lifetime',
        trialDays: 0,
        isActive: true,
      });
    }
  };

  const handleEditPlan = (type: 'elite' | 'essential', index: number) => {
    const plan = state.plans[type][index];
    setNewPlan(plan);
    setActiveTab(type);
    setEditingPlan({ type, index });
  };

  const cancelEdit = () => {
    setNewPlan({
      _id: '',
      title: '',
      type: activeTab,
      price: 0,
      features: [],
      isPopular: false,
      billingPeriod: 'lifetime',
      trialDays: 0,
      isActive: true,
    });
    setEditingPlan(null);
  };

  const isFormValid = newPlan.title && newPlan.price !== undefined;

  return (
    <Container
      id="pricing"
      icon={DollarSign}
      title="Pricing Plans"
      description="Set up pricing for elite and essential plans"
    >
      <div className="w-full space-y-6">
        {/* Plan Type Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('elite')}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'elite'
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Elite Plans ({state.plans.elite?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('essential')}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'essential'
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Essential Plans ({state.plans.essential?.length || 0})
          </button>
        </div>

        {/* Plan Form */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">
              {editingPlan ? 'Edit' : 'Add'} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Plan
            </h3>
            {editingPlan && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Basic Plan Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Plan Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Premium Access, Basic Access"
                value={newPlan.title}
                onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="99.99"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Billing Period
              </label>
              <select
                value={newPlan.billingPeriod}
                onChange={(e) => setNewPlan(prev => ({ ...prev, billingPeriod: e.target.value as 'lifetime' | 'annually' | 'monthly' }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white outline-none"
              >
                <option value="lifetime">Lifetime</option>
                <option value="annually">Annually</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Trial Days
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={newPlan.trialDays}
                onChange={(e) => setNewPlan(prev => ({ ...prev, trialDays: Number(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.isPopular}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, isPopular: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Popular Plan</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPlan.isActive !== false}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Plan Features */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-800">Plan Features</h4>
            
            {/* Add Feature Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-4">
                <input
                  type="text"
                  placeholder="Feature title"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
              <div className="lg:col-span-4">
                <input
                  type="text"
                  placeholder="Feature description (optional)"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
                />
              </div>
              <div className="lg:col-span-2">
                <select
                  value={newFeature.provided.toString()}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, provided: e.target.value === 'true' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white outline-none"
                >
                  <option value="true">Included</option>
                  <option value="false">Not Included</option>
                </select>
              </div>
              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={handleAddFeature}
                  disabled={!newFeature.title.trim()}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Plus className="size-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* Features List */}
            {newPlan.features && newPlan.features.length > 0 && (
              <div className="space-y-2">
                {newPlan.features.map((feature, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {feature.provided ? (
                        <Check className="size-5 text-green-500" />
                      ) : (
                        <X className="size-5 text-red-500" />
                      )}
                      <div>
                        <span className="font-medium text-gray-800">{feature.title}</span>
                        {feature.description && (
                          <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Plan Button */}
          <button
            type="button"
            onClick={handleAddPlan}
            disabled={!isFormValid}
            className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {editingPlan ? 'Update Plan' : `Add ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Plan`}
          </button>
        </div>

        {/* Existing Plans */}
        {(state.plans[activeTab]?.length || 0) > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Plans
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {state.plans[activeTab]?.map((plan, index) => (
                <div key={plan._id} className="bg-white border border-gray-200 rounded-lg p-6 relative">
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Star className="size-3" />
                        Popular
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-gray-800">{plan.title}</h4>
                      <div className="text-3xl font-bold text-orange-500 mt-2">
                        ${plan.price}
                        {plan.billingPeriod !== 'lifetime' && (
                          <span className="text-sm text-gray-500">/{plan.billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                        )}
                      </div>
                      {plan.billingPeriod === 'lifetime' && (
                        <p className="text-sm text-gray-500 mt-1">One-time payment</p>
                      )}
                      {plan.trialDays && plan.trialDays > 0 && (
                        <p className="text-sm text-green-600 mt-1">{plan.trialDays} days free trial</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                          {feature.provided ? (
                            <Check className="size-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="size-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm",
                            feature.provided ? "text-gray-700" : "text-gray-400 line-through"
                          )}>
                            {feature.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => handleEditPlan(activeTab, index)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlan(activeTab, index)}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default PricingSection; 