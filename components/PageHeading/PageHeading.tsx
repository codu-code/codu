import React from "react";

const PageHeading = ({ children }: { children: React.ReactNode }) => (
  <h1 className="text-3xl tracking-tight font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-4xl mt-8 border-b pb-4">
    {children}
  </h1>
);

export default PageHeading;
