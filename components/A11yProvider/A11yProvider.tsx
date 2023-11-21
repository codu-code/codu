"use client";

import React, { type ReactNode } from "react";
import reportAccessibility from "@/utils/reportAccessibility";

const A11yProvider = ({ children }: { children: ReactNode }) => {
  reportAccessibility(React);
  return children;
};

export default A11yProvider;
