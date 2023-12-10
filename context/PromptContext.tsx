"use client";
import { createContext, useContext, useState } from "react";

const defaultContextValue = {
  unsavedChanges: false,
  setUnsavedChanges: () => {},
};

const PromptContext = createContext(defaultContextValue);

export const usePrompt = () => useContext(PromptContext);

export const PromptProvider = ({ children }) => {
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  return (
    <PromptContext.Provider value={{ unsavedChanges, setUnsavedChanges }}>
      {children}
    </PromptContext.Provider>
  );
};
