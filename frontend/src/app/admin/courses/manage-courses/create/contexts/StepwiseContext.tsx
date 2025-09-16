"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface StepwiseContextType {
  courseId: string | null;
  setCourseId: (id: string | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isStepComplete: (step: number) => boolean;
  markStepComplete: (step: number) => void;
  resetSteps: () => void;
  completedSteps: Set<number>;
}

const StepwiseContext = createContext<StepwiseContextType | null>(null);

// LocalStorage keys for persistence
const STEPWISE_COURSE_ID_KEY = "stepwise_course_id";
const STEPWISE_CURRENT_STEP_KEY = "stepwise_current_step";
const STEPWISE_COMPLETED_STEPS_KEY = "stepwise_completed_steps";

export const StepwiseProvider = ({ children }: { children: React.ReactNode }) => {
  const [courseId, setCourseIdState] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const savedCourseId = localStorage.getItem(STEPWISE_COURSE_ID_KEY);
      const savedCurrentStep = localStorage.getItem(STEPWISE_CURRENT_STEP_KEY);
      const savedCompletedSteps = localStorage.getItem(STEPWISE_COMPLETED_STEPS_KEY);

      if (savedCourseId) {
        setCourseIdState(savedCourseId);
      }

      if (savedCurrentStep) {
        setCurrentStepState(parseInt(savedCurrentStep, 10));
      }

      if (savedCompletedSteps) {
        setCompletedSteps(new Set(JSON.parse(savedCompletedSteps)));
      }

      console.log("📊 Loaded stepwise state:", {
        courseId: savedCourseId,
        currentStep: savedCurrentStep,
        completedSteps: savedCompletedSteps
      });
    } catch (error) {
      console.error("Failed to load stepwise state:", error);
    }
  }, []);

  // Save courseId to localStorage
  const setCourseId = (id: string | null) => {
    setCourseIdState(id);
    try {
      if (id) {
        localStorage.setItem(STEPWISE_COURSE_ID_KEY, id);
        console.log("📊 Saved courseId to localStorage:", id);
      } else {
        localStorage.removeItem(STEPWISE_COURSE_ID_KEY);
        console.log("📊 Removed courseId from localStorage");
      }
    } catch (error) {
      console.error("Failed to save courseId:", error);
    }
  };

  // Save current step to localStorage
  const setCurrentStep = (step: number) => {
    setCurrentStepState(step);
    try {
      localStorage.setItem(STEPWISE_CURRENT_STEP_KEY, step.toString());
      console.log("📊 Saved current step to localStorage:", step);
    } catch (error) {
      console.error("Failed to save current step:", error);
    }
  };

  // Check if a step is complete
  const isStepComplete = (step: number): boolean => {
    return completedSteps.has(step);
  };

  // Mark a step as complete
  const markStepComplete = (step: number) => {
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(step);
    setCompletedSteps(newCompletedSteps);
    
    try {
      localStorage.setItem(
        STEPWISE_COMPLETED_STEPS_KEY, 
        JSON.stringify(Array.from(newCompletedSteps))
      );
      console.log("📊 Marked step as complete:", step);
    } catch (error) {
      console.error("Failed to save completed steps:", error);
    }
  };

  // Reset all steps (for new course creation)
  const resetSteps = () => {
    setCourseIdState(null);
    setCurrentStepState(1);
    setCompletedSteps(new Set());
    
    try {
      localStorage.removeItem(STEPWISE_COURSE_ID_KEY);
      localStorage.removeItem(STEPWISE_CURRENT_STEP_KEY);
      localStorage.removeItem(STEPWISE_COMPLETED_STEPS_KEY);
      console.log("📊 Reset all stepwise state");
    } catch (error) {
      console.error("Failed to reset stepwise state:", error);
    }
  };

  const value: StepwiseContextType = {
    courseId,
    setCourseId,
    currentStep,
    setCurrentStep,
    isStepComplete,
    markStepComplete,
    resetSteps,
    completedSteps,
  };

  return (
    <StepwiseContext.Provider value={value}>
      {children}
    </StepwiseContext.Provider>
  );
};

export const useStepwise = () => {
  const context = useContext(StepwiseContext);
  if (!context) {
    throw new Error("useStepwise must be used within a StepwiseProvider");
  }
  return context;
};
