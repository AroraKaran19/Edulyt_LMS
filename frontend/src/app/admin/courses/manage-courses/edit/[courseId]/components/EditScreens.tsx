// Simple solution: Wrapped screens that work with edit context
import React, { createContext, useContext } from "react";
import { useEditScreen } from "../contexts/EditScreenContext";

// Create screen imports
import CreateScreen1 from "../../../create/components/Screen1";
import CreateScreen2 from "../../../create/components/Screen2";
import CreateScreen3 from "../../../create/components/Screen3";
import CreateScreen4 from "../../../create/components/Screen4";
import CreateScreen5 from "../../../create/components/Screen5";
import CreateScreen6 from "../../../create/components/Screen6";
import CreateScreen7 from "../../../create/components/Screen7";
import CreateScreen8 from "../../../create/components/Screen8";

// Define the same interface as ScreenContext
interface ScreenContextType {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  clearScreenHistory: () => void;
}

// Create a compatible context that can be used by ScreenNavigation
const CompatibleScreenContext = createContext<ScreenContextType>({
  activeScreen: "screen1",
  setActiveScreen: () => {},
  clearScreenHistory: () => {},
});

// Provider that bridges edit context to create context
const EditCompatibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const editContext = useEditScreen();
  
  return (
    <CompatibleScreenContext.Provider value={editContext}>
      {children}
    </CompatibleScreenContext.Provider>
  );
};

// Override the useScreen hook for edit mode
const useScreenForEdit = () => {
  const context = useContext(CompatibleScreenContext);
  if (!context) {
    throw new Error("useScreen must be used within a ScreenProvider");
  }
  return context;
};

// Temporarily override the module for create components
(globalThis as any).__edit_mode_useScreen__ = useScreenForEdit;

// Wrapped screen components that work in edit mode
export const EditScreen1 = () => (
  <EditCompatibleProvider>
    <CreateScreen1 />
  </EditCompatibleProvider>
);

export const EditScreen2 = () => (
  <EditCompatibleProvider>
    <CreateScreen2 />
  </EditCompatibleProvider>
);

export const EditScreen3 = () => (
  <EditCompatibleProvider>
    <CreateScreen3 />
  </EditCompatibleProvider>
);

export const EditScreen4 = () => (
  <EditCompatibleProvider>
    <CreateScreen4 />
  </EditCompatibleProvider>
);

export const EditScreen5 = () => (
  <EditCompatibleProvider>
    <CreateScreen5 />
  </EditCompatibleProvider>
);

export const EditScreen6 = () => (
  <EditCompatibleProvider>
    <CreateScreen6 />
  </EditCompatibleProvider>
);

export const EditScreen7 = () => (
  <EditCompatibleProvider>
    <CreateScreen7 />
  </EditCompatibleProvider>
);

export const EditScreen8: React.FC<{ courseId: string }> = ({ courseId }) => (
  <EditCompatibleProvider>
    <CreateScreen8 isEditMode={true} courseId={courseId} />
  </EditCompatibleProvider>
);
