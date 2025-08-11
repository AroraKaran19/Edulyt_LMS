"use client";
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

const EDIT_CURRENT_SCREEN_KEY = "course_edit_current_screen";

export const EditScreenProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeScreen, setActiveScreen] = useState("screen1");

  // Load saved screen from localStorage on mount
  useEffect(() => {
    try {
      const savedScreen = localStorage.getItem(EDIT_CURRENT_SCREEN_KEY);
      if (savedScreen) {
        setActiveScreen(savedScreen);
        console.log("Restored edit current screen from localStorage:", savedScreen);
      }
    } catch (error) {
      console.error("Failed to load edit current screen from localStorage:", error);
    }
  }, []);

  // Enhanced setActiveScreen that also saves to localStorage
  const handleSetActiveScreen = (screen: string) => {
    try {
      setActiveScreen(screen);
      localStorage.setItem(EDIT_CURRENT_SCREEN_KEY, screen);
      console.log("Saved edit current screen to localStorage:", screen);
    } catch (error) {
      console.error("Failed to save edit current screen to localStorage:", error);
      // Still update the state even if localStorage fails
      setActiveScreen(screen);
    }
  };

  // Clear screen history from localStorage
  const clearScreenHistory = () => {
    try {
      localStorage.removeItem(EDIT_CURRENT_SCREEN_KEY);
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
