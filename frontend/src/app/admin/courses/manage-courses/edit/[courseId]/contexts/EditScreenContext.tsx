import React, { createContext, useContext, useState, useEffect } from "react";

interface EditScreenContextType {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  clearScreenHistory: () => void;
}

const EditScreenContext = createContext<EditScreenContextType>({
  activeScreen: "screen1",
  setActiveScreen: () => {},
  clearScreenHistory: () => {},
});

const getScreenKey = (courseId: string) => `course_edit_${courseId}_current_screen`;

export const EditScreenProvider = ({ 
  children, 
  courseId 
}: { 
  children: React.ReactNode;
  courseId: string;
}) => {
  const [activeScreen, setActiveScreen] = useState("screen1");
  const screenKey = getScreenKey(courseId);

  // Load saved screen from localStorage on mount
  useEffect(() => {
    try {
      const savedScreen = localStorage.getItem(screenKey);
      if (savedScreen) {
        setActiveScreen(savedScreen);
        console.log("Restored current edit screen from localStorage:", savedScreen);
      }
    } catch (error) {
      console.error("Failed to load current edit screen from localStorage:", error);
    }
  }, [screenKey]);

  // Enhanced setActiveScreen that also saves to localStorage
  const handleSetActiveScreen = (screen: string) => {
    try {
      setActiveScreen(screen);
      localStorage.setItem(screenKey, screen);
      console.log("Saved current edit screen to localStorage:", screen);
    } catch (error) {
      console.error("Failed to save current edit screen to localStorage:", error);
      // Still update the state even if localStorage fails
      setActiveScreen(screen);
    }
  };

  // Clear screen history from localStorage
  const clearScreenHistory = () => {
    try {
      localStorage.removeItem(screenKey);
      setActiveScreen("screen1");
      console.log("Cleared edit screen history from localStorage");
    } catch (error) {
      console.error("Failed to clear edit screen history:", error);
    }
  };

  return (
    <EditScreenContext.Provider value={{ 
      activeScreen, 
      setActiveScreen: handleSetActiveScreen,
      clearScreenHistory 
    }}>
      {children}
    </EditScreenContext.Provider>
  );
};

export const useEditScreen = () => {
  const context = useContext(EditScreenContext);
  if (!context) {
    throw new Error("useEditScreen must be used within an EditScreenProvider");
  }
  return context;
};