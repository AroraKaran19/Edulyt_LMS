"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface ScreenContextType {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
}

const ScreenContext = createContext<ScreenContextType>({
  activeScreen: "screen1",
  setActiveScreen: () => {},
});

const CURRENT_SCREEN_KEY = "course_creation_current_screen";

export const ScreenProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeScreen, setActiveScreen] = useState("screen1");

  // Load saved screen from localStorage on mount
  useEffect(() => {
    try {
      const savedScreen = localStorage.getItem(CURRENT_SCREEN_KEY);
      if (savedScreen) {
        setActiveScreen(savedScreen);
        console.log("Restored current screen from localStorage:", savedScreen);
      }
    } catch (error) {
      console.error("Failed to load current screen from localStorage:", error);
    }
  }, []);

  // Enhanced setActiveScreen that also saves to localStorage
  const handleSetActiveScreen = (screen: string) => {
    try {
      // Check if course metadata has been created
      const courseId = localStorage.getItem("current_course_id");
      const isCourseCreated = !!courseId;
      
      // If course is created, only allow forward navigation (higher screen numbers)
      if (isCourseCreated) {
        const targetScreenNumber = parseInt(screen.replace('screen', ''));
        
        // Only allow navigation to screens 11, 12, 13 (metadata creation and beyond)
        if (targetScreenNumber < 11) {
          console.warn("Cannot navigate back to previous screens after course metadata is created");
          return;
        }
      }
      
      setActiveScreen(screen);
      localStorage.setItem(CURRENT_SCREEN_KEY, screen);
      console.log("Saved current screen to localStorage:", screen);
    } catch (error) {
      console.error("Failed to save current screen to localStorage:", error);
      // Still update the state even if localStorage fails
      setActiveScreen(screen);
    }
  };

  return (
    <ScreenContext.Provider value={{ 
      activeScreen, 
      setActiveScreen: handleSetActiveScreen
    }}>
      {children}
    </ScreenContext.Provider>
  );
};

export const useScreen = () => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error("useScreen must be used within a ScreenProvider");
  }
  return context;
};
