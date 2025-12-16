"use client";
import React, { createContext, useContext, useState } from "react";

type PromptContextType = {
  unsavedChanges: boolean;
  setUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
};

const defaultContextValue: PromptContextType = {
  unsavedChanges: false,
  setUnsavedChanges: () => {},
};

const PromptContext = createContext<PromptContextType>(defaultContextValue);

export const usePrompt = () => useContext(PromptContext);

export const PromptProvider = ({ children }: { children: React.ReactNode }) => {
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  return (
    <PromptContext.Provider value={{ unsavedChanges, setUnsavedChanges }}>
      {children}
    </PromptContext.Provider>
  );
};
