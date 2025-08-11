import React, { createContext, useContext, ReactNode } from "react";
import { useEditCourseReducer } from "../hooks/useEditCourseReducer";
import { CourseState } from "../core/state";

// ===================
// Context Interface
// ===================

interface EditCourseContextType {
  state: CourseState;
  actions: ReturnType<typeof useEditCourseReducer>["actions"];
  errorLog: any[];
}

// ===================
// Context Creation
// ===================

const EditCourseContext = createContext<EditCourseContextType | undefined>(
  undefined
);

// ===================
// Provider Component
// ===================

interface EditCourseReducerProviderProps {
  children: ReactNode;
  courseId?: string;
}

export const EditCourseReducerProvider: React.FC<EditCourseReducerProviderProps> = ({
  children,
  courseId,
}) => {
  const { state, actions, errorLog } = useEditCourseReducer(courseId);

  const contextValue: EditCourseContextType = {
    state,
    actions,
    errorLog,
  };

  return (
    <EditCourseContext.Provider value={contextValue}>
      {children}
    </EditCourseContext.Provider>
  );
};

// ===================
// Hook for Using Context
// ===================

export const useEditCourseContext = (): EditCourseContextType => {
  const context = useContext(EditCourseContext);
  if (context === undefined) {
    throw new Error(
      "useEditCourseContext must be used within an EditCourseReducerProvider"
    );
  }
  return context;
};
