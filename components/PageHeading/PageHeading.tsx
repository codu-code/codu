import React from "react";

const PageHeading = ({ children }: { children: React.ReactNode }) => (
  <h1 className="mt-8 border-b pb-4 text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
    {children}
  </h1>
);

export default PageHeading;
