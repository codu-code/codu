import type React from "react";

export const reportAccessibility = async (
  App: typeof React,
  config?: Record<string, unknown>,
): Promise<void> => {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const axe = await import("@axe-core/react");
    const ReactDOM = await import("react-dom");

    axe.default(App, ReactDOM, 1000, config);
  }
};

export default reportAccessibility;
