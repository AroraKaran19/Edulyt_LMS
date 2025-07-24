"use client";
import React, { useState } from "react";
import Container from "@/app/(pages)/admin/components/ui/Container";
import { Target, Plus, X } from "lucide-react";
import FlexBox from "@/components/ui/FlexBox";
import { useCourseFormContext } from "../context/CourseFormContext";

const LearningOutcomesSection = () => {
  const {
    state,
    updateField,
    addSkill,
    removeSkill,
    addKeyFeature,
    removeKeyFeature,
  } = useCourseFormContext();

  const [newSkill, setNewSkill] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newCareerPath, setNewCareerPath] = useState("");
  const [newPrerequisite, setNewPrerequisite] = useState("");
  const [newKeyFeature, setNewKeyFeature] = useState({ title: "", description: "" });

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      addSkill(newSkill.trim());
      setNewSkill("");
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      updateField('features', [...(state.features || []), newFeature.trim()]);
      setNewFeature("");
    }
  };

  const handleAddCareerPath = () => {
    if (newCareerPath.trim()) {
      updateField('careerPaths', [...state.careerPaths, newCareerPath.trim()]);
      setNewCareerPath("");
    }
  };

  const handleAddPrerequisite = () => {
    if (newPrerequisite.trim()) {
      updateField('prerequisites', [...(state.prerequisites || []), newPrerequisite.trim()]);
      setNewPrerequisite("");
    }
  };

  const handleAddKeyFeature = () => {
    if (newKeyFeature.title.trim() && newKeyFeature.description.trim()) {
      addKeyFeature(newKeyFeature);
      setNewKeyFeature({ title: "", description: "" });
    }
  };

  const removeFeature = (feature: string) => {
    const index = (state.features || []).indexOf(feature);
    if (index > -1) {
      updateField('features', (state.features || []).filter((_, i) => i !== index));
    }
  };

  const removeCareerPath = (path: string) => {
    const index = state.careerPaths.indexOf(path);
    if (index > -1) {
      updateField('careerPaths', state.careerPaths.filter((_, i) => i !== index));
    }
  };

  const removePrerequisite = (prerequisite: string) => {
    const index = (state.prerequisites || []).indexOf(prerequisite);
    if (index > -1) {
      updateField('prerequisites', (state.prerequisites || []).filter((_, i) => i !== index));
    }
  };

  return (
    <Container
      id="learning-outcomes"
      icon={Target}
      title="Learning Outcomes & Skills"
      description="Define what students will learn and achieve"
    >
      <div className="w-full space-y-6">
        {/* What You Will Learn */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            What You Will Learn <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Describe what students will learn from this course..."
            value={state.whatYouWillLearn}
            onChange={(e) => updateField('whatYouWillLearn', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
          />
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Skills Students Will Gain
          </label>
          <FlexBox className="w-full gap-2">
            <input
              type="text"
              placeholder="Add a skill (e.g., React, Python, etc.)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddSkill())
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <Plus className="size-4" />
            </button>
          </FlexBox>
          {state.skills.length > 0 && (
            <FlexBox className="w-full flex-wrap gap-2 mt-2">
              {state.skills.map((skill, index) => (
                <FlexBox
                  key={index}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm gap-2 items-center select-none"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="size-3 cursor-pointer" />
                  </button>
                </FlexBox>
              ))}
            </FlexBox>
          )}
        </div>

        {/* Key Features */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Key Features
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Feature title"
                value={newKeyFeature.title}
                onChange={(e) => setNewKeyFeature(prev => ({ ...prev, title: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
              />
              <input
                type="text"
                placeholder="Feature description"
                value={newKeyFeature.description}
                onChange={(e) => setNewKeyFeature(prev => ({ ...prev, description: e.target.value }))}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddKeyFeature())
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddKeyFeature}
              disabled={!newKeyFeature.title.trim() || !newKeyFeature.description.trim()}
              className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Add Key Feature
            </button>
          </div>
          {state.keyFeatures.length > 0 && (
            <div className="space-y-2 mt-4">
              {state.keyFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{feature.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeKeyFeature(index)}
                    className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Features */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Course Features
          </label>
          <FlexBox className="w-full gap-2">
            <input
              type="text"
              placeholder="Add a course feature (e.g., Lifetime Access, Certificate)"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddFeature())
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
            <button
              type="button"
              onClick={handleAddFeature}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <Plus className="size-4" />
            </button>
          </FlexBox>
          {(state.features || []).length > 0 && (
            <FlexBox className="w-full flex-wrap gap-2 mt-2">
              {(state.features || []).map((feature, index) => (
                <FlexBox
                  key={index}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm gap-2 items-center select-none"
                >
                  <span>{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(feature)}
                    className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="size-3 cursor-pointer" />
                  </button>
                </FlexBox>
              ))}
            </FlexBox>
          )}
        </div>

        {/* Career Paths */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Career Paths <span className="text-red-500">*</span>
          </label>
          <FlexBox className="w-full gap-2">
            <input
              type="text"
              placeholder="Add a career path (e.g., Frontend Developer, Data Analyst)"
              value={newCareerPath}
              onChange={(e) => setNewCareerPath(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddCareerPath())
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
            <button
              type="button"
              onClick={handleAddCareerPath}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <Plus className="size-4" />
            </button>
          </FlexBox>
          {state.careerPaths.length > 0 && (
            <FlexBox className="w-full flex-wrap gap-2 mt-2">
              {state.careerPaths.map((path, index) => (
                <FlexBox
                  key={index}
                  className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm gap-2 items-center select-none"
                >
                  <span>{path}</span>
                  <button
                    type="button"
                    onClick={() => removeCareerPath(path)}
                    className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="size-3 cursor-pointer" />
                  </button>
                </FlexBox>
              ))}
            </FlexBox>
          )}
        </div>

        {/* Who Should Join */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Who Should Join This Course <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Describe who would benefit most from this course..."
            value={state.whoShouldJoin}
            onChange={(e) => updateField('whoShouldJoin', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none outline-none"
          />
        </div>

        {/* Prerequisites */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Prerequisites
          </label>
          <FlexBox className="w-full gap-2">
            <input
              type="text"
              placeholder="Add a prerequisite (e.g., Basic HTML knowledge)"
              value={newPrerequisite}
              onChange={(e) => setNewPrerequisite(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddPrerequisite())
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
            />
            <button
              type="button"
              onClick={handleAddPrerequisite}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <Plus className="size-4" />
            </button>
          </FlexBox>
          {(state.prerequisites || []).length > 0 && (
            <FlexBox className="w-full flex-wrap gap-2 mt-2">
              {(state.prerequisites || []).map((prerequisite, index) => (
                <FlexBox
                  key={index}
                  className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm gap-2 items-center select-none"
                >
                  <span>{prerequisite}</span>
                  <button
                    type="button"
                    onClick={() => removePrerequisite(prerequisite)}
                    className="hover:bg-yellow-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="size-3 cursor-pointer" />
                  </button>
                </FlexBox>
              ))}
            </FlexBox>
          )}
          <p className="text-xs text-gray-500">
            Leave empty if no prerequisites are required
          </p>
        </div>
      </div>
    </Container>
  );
};

export default LearningOutcomesSection; 