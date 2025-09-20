"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface ScreenContextType {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  clearScreenHistory: () => void;
}

const ScreenContext = createContext<ScreenContextType>({
  activeScreen: "screen1",
  setActiveScreen: () => {},
  clearScreenHistory: () => {},
});

const CURRENT_SCREEN_KEY = "course_edit_current_screen";

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

  const handleSetActiveScreen = (screen: string) => {
    try {
      
      setActiveScreen(screen);
      localStorage.setItem(CURRENT_SCREEN_KEY, screen);
      console.log("Saved current screen to localStorage:", screen);
    } catch (error) {
      console.error("Failed to save current screen to localStorage:", error);
      // Still update the state even if localStorage fails
      setActiveScreen(screen);
    }
  };

  const clearScreenHistory = () => {
    try {
      localStorage.removeItem(CURRENT_SCREEN_KEY);
      setActiveScreen("screen1");
      console.log("Cleared screen history from localStorage");
    } catch (error) {
      console.error("Failed to clear screen history:", error);
    }
  };

  return (
    <ScreenContext.Provider value={{ 
      activeScreen, 
      setActiveScreen: handleSetActiveScreen,
      clearScreenHistory 
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
